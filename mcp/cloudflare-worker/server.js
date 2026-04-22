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
    {
      name: 'cloudflareWorker.fetchEndpoint',
      description: 'Makes an HTTP GET or POST request to the deployed Cloudflare Worker URL and returns the response.',
      inputSchema: jsonSchema.object({
        url: jsonSchema.string({
          description: 'Full URL to fetch from the Cloudflare Worker.',
        }),
        method: jsonSchema.string({
          description: 'HTTP method, e.g. GET or POST.',
          default: 'GET',
          nullable: true,
        }),
        body: jsonSchema.string({
          description: 'JSON body string for POST requests.',
          nullable: true,
        }),
        headers: jsonSchema.object({}),
      }),
    },
    {
      name: 'cloudflareWorker.queryD1',
      description: 'Executes a read-only SQL query (SELECT, PRAGMA, or EXPLAIN) against the D1 database using wrangler d1 execute.',
      inputSchema: jsonSchema.object({
        sql: jsonSchema.string({
          description: 'SQL SELECT query to execute. Must start with SELECT, PRAGMA, or EXPLAIN.',
        }),
        database: jsonSchema.string({
          description: 'D1 database name.',
          default: 'tobacco-tracker',
          nullable: true,
        }),
        envName: jsonSchema.string({
          description: 'Optional Wrangler environment name.',
          nullable: true,
        }),
      }),
    },
    {
      name: 'cloudflareWorker.listD1Tables',
      description: 'Lists all tables in the D1 database.',
      inputSchema: jsonSchema.object({
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
  } else if (name === 'cloudflareWorker.fetchEndpoint') {
    if (!args.url || typeof args.url !== 'string') {
      throw new Error('url is required and must be a string.');
    }
    new URL(args.url);
    const method = (args.method ?? 'GET').toUpperCase();
    const fetchOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(args.headers ?? {}),
      },
    };
    if (args.body && method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = args.body;
    }
    const response = await fetch(args.url, fetchOptions);
    const contentType = response.headers.get('content-type') ?? '';
    let responseBody;
    if (contentType.includes('application/json')) {
      const json = await response.json();
      responseBody = JSON.stringify(json, null, 2);
    } else {
      responseBody = await response.text();
    }
    const headerEntries = {};
    response.headers.forEach((value, key) => {
      headerEntries[key] = value;
    });
    output = JSON.stringify({
      status: response.status,
      statusText: response.statusText,
      headers: headerEntries,
      body: responseBody,
    }, null, 2);
  } else if (name === 'cloudflareWorker.queryD1') {
    if (!args.sql || typeof args.sql !== 'string') {
      throw new Error('sql is required and must be a string.');
    }
    const trimmedSql = args.sql.trim();
    if (!/^(SELECT|PRAGMA|EXPLAIN)\s/i.test(trimmedSql)) {
      throw new Error('Only SELECT, PRAGMA, or EXPLAIN queries are allowed.');
    }
    const database = args.database ?? 'tobacco-tracker';
    const d1Args = [
      'd1', 'execute', database,
      '--command', trimmedSql,
      '--config', wranglerConfig,
    ];
    if (args.envName) {
      d1Args.push('--env', args.envName);
    }
    output = await runWrangler(d1Args);
  } else if (name === 'cloudflareWorker.listD1Tables') {
    const sql = "SELECT name FROM sqlite_master WHERE type='table'";
    const d1Args = [
      'd1', 'execute', 'tobacco-tracker',
      '--command', sql,
      '--config', wranglerConfig,
    ];
    if (args.envName) {
      d1Args.push('--env', args.envName);
    }
    output = await runWrangler(d1Args);
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
