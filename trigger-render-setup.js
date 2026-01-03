#!/usr/bin/env node

/**
 * Trigger a one-off job on Render to run the database setup script
 * Usage: node trigger-render-setup.js
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Load render API key from config or environment
const configPath = './windsurf_mcp_config.json';
let renderApiKey = process.env.RENDER_API_KEY;

if (!renderApiKey && fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const bearerToken = config.mcpServers?.render?.headers?.Authorization;
  if (bearerToken) {
    renderApiKey = bearerToken.replace('Bearer ', '');
  }
}

if (!renderApiKey) {
  console.error('❌ Missing RENDER_API_KEY. Set RENDER_API_KEY env var or ensure windsurf_mcp_config.json exists.');
  process.exit(1);
}

const SERVICE_ID = 'srv-d4a7gq7gi27c739t91i0'; // process-management service
const RENDER_API = 'https://api.render.com/v1';

async function triggerSetupJob() {
  try {
    console.log('🚀 Triggering one-off job on Render...');
    console.log(`Service ID: ${SERVICE_ID}`);
    console.log(`API Endpoint: ${RENDER_API}/services/${SERVICE_ID}/jobs`);

    const response = await fetch(`${RENDER_API}/services/${SERVICE_ID}/jobs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${renderApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        startCommand: 'node render-setup/setup-database.js',
        planId: 'free',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Render API error: ${response.status}`);
      console.error(`Response: ${errorText}`);
      process.exit(1);
    }

    const jobData = await response.json();
    console.log('✅ Job created successfully!');
    console.log(`Job ID: ${jobData.id}`);
    console.log(`Status: ${jobData.status}`);
    console.log('\n📋 Job details:');
    console.log(JSON.stringify(jobData, null, 2));
    console.log('\n💡 Check the job progress in your Render dashboard:');
    console.log(`https://dashboard.render.com/web/${SERVICE_ID}`);

  } catch (error) {
    console.error('❌ Error triggering job:', error.message);
    process.exit(1);
  }
}

triggerSetupJob();
