#!/usr/bin/env node

import dotenv from 'dotenv';
import fetch from 'node-fetch';
import {
  Server,
  StdioServerTransport,
  jsonSchema,
} from '@modelcontextprotocol/sdk/server/index.js';

// Load environment variables (optional for local development)
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('[Gemini MCP] Missing GEMINI_API_KEY environment variable.');
  process.exit(1);
}

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const server = new Server({
  name: 'gemini-mcp-server',
  version: '0.1.0',
});

// List available tools (just a single text generation tool for now)
server.setRequestHandler('listTools', async () => ({
  tools: [
    {
      name: 'gemini.generateText',
      description: 'Generate text with Google Gemini (Flash 2.0).',
      inputSchema: jsonSchema.object({
        prompt: jsonSchema.string({
          description: 'Prompt to send to Gemini.',
        }),
        systemInstructions: jsonSchema.string({
          description: 'Optional system instructions to guide the model.',
          nullable: true,
        }),
        temperature: jsonSchema.number({
          description: 'Sampling temperature (0.0 - 1.0).',
          minimum: 0,
          maximum: 1,
          default: 0.2,
          nullable: true,
        }),
        maxTokens: jsonSchema.number({
          description: 'Maximum number of tokens in the response.',
          minimum: 1,
          maximum: 2048,
          default: 512,
          nullable: true,
        }),
      }),
    },
  ],
}));

async function callGemini(prompt, systemInstructions, temperature = 0.2, maxTokens = 512) {
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };

  if (systemInstructions) {
    body.systemInstruction = {
      parts: [{ text: systemInstructions }],
    };
  }

  const response = await fetch(
    `${GEMINI_API_URL}/gemini-1.5-flash-latest:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${text}`);
  }

  const data = await response.json();
  const candidates = data?.candidates ?? [];
  if (candidates.length === 0) {
    return 'Gemini did not return a response.';
  }

  const first = candidates[0];
  const parts = first?.content?.parts ?? [];
  const textParts = parts
    .map((part) => part.text)
    .filter(Boolean);

  return textParts.join('\n\n');
}

server.setRequestHandler('callTool', async (request) => {
  const { name, arguments: args } = request.params;

  if (name !== 'gemini.generateText') {
    throw new Error(`Unsupported tool: ${name}`);
  }

  const prompt = args?.prompt;
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt is required and must be a string.');
  }

  const systemInstructions = args?.systemInstructions ?? null;
  const temperature = typeof args?.temperature === 'number' ? args.temperature : 0.2;
  const maxTokens = typeof args?.maxTokens === 'number' ? args.maxTokens : 512;

  const output = await callGemini(prompt, systemInstructions, temperature, maxTokens);

  return {
    content: [
      {
        type: 'text',
        text: output,
      },
    ],
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
