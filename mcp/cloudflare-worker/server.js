#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';
import {
  Server,
  StdioServerTransport,
  jsonSchema,
} from '@modelcontextprotocol/sdk/server/index.js';

dotenv.config();

const connectorDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(connectorDir, '..', '..');
const wranglerConfig = path.join(repoRoot, 'wrangler.toml');
const defaultTimeoutMs = Number(process.env.CLOUDFLARE_WORKER_TIMEOUT_MS ?? 120000);

const server = new Server({
  name: 'cloudflare-worker-mcp-server',
  version: '0.1.0',
});

function runWrangler(args, { input, resolveOnTimeout = false, timeoutMs = defaultTimeoutMs } = {}) {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const child = spawn(command, ['wrangler', ...args], {
      cwd: repoRoot,
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let didTimeout = false;
    const timer = setTimeout(() => {
      didTimeout = true;
      child.kill('SIGTERM');
      if (!resolveOnTimeout) {
        reject(new Error(`Wrangler command timed out after ${timeoutMs}ms: wrangler ${args.join(' ')}`));
      }
    }, timeoutMs);

    if (input) {
      child.stdin.write(input);
      if (!input.endsWith('\n')) {
        child.stdin.write('\n');
      }
    }
    child.stdin.end();

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const output = [stdout.trim(), stderr.trim()].filter(Boolean).join('\n\n');
      if (didTimeout && resolveOnTimeout) {
        resolve(output || 'Wrangler tail completed without log output.');
        return;
      }

      if (code !== 0) {
        reject(new Error(output || `Wrangler exited with code ${code}`));
        return;
      }

      resolve(output || 'Wrangler completed successfully.');
    });
  });
}

function buildDeployArgs(args = {}) {
  const deployArgs = ['deploy', '--config', wranglerConfig];

  if (args.dryRun) {
    deployArgs.push('--dry-run');
  }

  if (args.envName) {
    deployArgs.push('--env', args.envName);
  }

  if (args.minify) {
    deployArgs.push('--minify');
  }

  return deployArgs;
}

server.setRequestHandler('listTools', async () => ({
  tools: [
    {
      name: 'cloudflareWorker.deploy',
      description: 'Deploy the process-management Cloudflare Worker with Wrangler.',
      inputSchema: jsonSchema.object({
        envName: jsonSchema.string({
          description: 'Optional Wrangler environment name.',
          nullable: true,
        }),
        dryRun: jsonSchema.boolean({
          description: 'Validate the Worker deploy without publishing it.',
          default: false,
          nullable: true,
        }),
        minify: jsonSchema.boolean({
          description: 'Minify the Worker before deploy.',
          default: true,
          nullable: true,
        }),
      }),
    },
    {
      name: 'cloudflareWorker.whoami',
      description: 'Check which Cloudflare account Wrangler is authenticated as.',
      inputSchema: jsonSchema.object({}),
    },
    {
      name: 'cloudflareWorker.tail',
      description: 'Start a short Wrangler tail session for Worker logs.',
      inputSchema: jsonSchema.object({
        seconds: jsonSchema.number({
          description: 'How long to stream logs before stopping.',
          minimum: 5,
          maximum: 120,
          default: 30,
          nullable: true,
        }),
        envName: jsonSchema.string({
          description: 'Optional Wrangler environment name.',
          nullable: true,
        }),
      }),
    },
    {
      name: 'cloudflareWorker.setOrigin',
      description: 'Set ORIGIN_URL for the Worker through Wrangler vars.',
      inputSchema: jsonSchema.object({
        originUrl: jsonSchema.string({
          description: 'Render or app origin URL to proxy, for example https://process-management-4t4o.onrender.com.',
        }),
        envName: jsonSchema.string({
          description: 'Optional Wrangler environment name.',
          nullable: true,
        }),
      }),
    },
  ],
}));

server.setRequestHandler('callTool', async (request) => {
  const { name, arguments: args = {} } = request.params;
  let output;

  if (name === 'cloudflareWorker.deploy') {
    output = await runWrangler(buildDeployArgs({
      ...args,
      minify: args.minify ?? true,
    }));
  } else if (name === 'cloudflareWorker.whoami') {
    output = await runWrangler(['whoami']);
  } else if (name === 'cloudflareWorker.tail') {
    const tailArgs = ['tail', '--config', wranglerConfig];
    if (args.envName) {
      tailArgs.push('--env', args.envName);
    }
    output = await runWrangler(tailArgs, {
      resolveOnTimeout: true,
      timeoutMs: Number(args.seconds ?? 30) * 1000,
    });
  } else if (name === 'cloudflareWorker.setOrigin') {
    if (!args.originUrl || typeof args.originUrl !== 'string') {
      throw new Error('originUrl is required and must be a string.');
    }

    new URL(args.originUrl);
    const varArgs = ['secret', 'put', 'ORIGIN_URL', '--config', wranglerConfig];
    if (args.envName) {
      varArgs.push('--env', args.envName);
    }
    output = await runWrangler(varArgs, {
      input: args.originUrl,
    });
  } else {
    throw new Error(`Unsupported tool: ${name}`);
  }

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
