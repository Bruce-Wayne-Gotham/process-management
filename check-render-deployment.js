#!/usr/bin/env node

/**
 * Check Render deployment status and logs using Render API
 */

import fetch from 'node-fetch';
import fs from 'fs';

// Load render API key from config
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
  console.error('❌ Missing RENDER_API_KEY');
  process.exit(1);
}

const SERVICE_ID = 'srv-d4a7gq7gi27c739t91i0'; // process-management
const RENDER_API = 'https://api.render.com/v1';

async function checkDeploymentStatus() {
  try {
    console.log('🔍 Fetching deployment status from Render...\n');

    // Get service info
    const serviceResponse = await fetch(`${RENDER_API}/services/${SERVICE_ID}`, {
      headers: {
        'Authorization': `Bearer ${renderApiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!serviceResponse.ok) {
      const errorText = await serviceResponse.text();
      console.error(`❌ Failed to fetch service: ${serviceResponse.status}`);
      console.error(`Response: ${errorText}`);
      process.exit(1);
    }

    const service = await serviceResponse.json();
    console.log('📋 Service Details:');
    console.log(`  Name: ${service.name}`);
    console.log(`  URL: ${service.dashboardUrl}`);
    console.log(`  Status: ${service.suspended || 'running'}`);
    console.log('');

    // Get deployments
    console.log('📦 Fetching recent deployments...\n');
    const deploymentsResponse = await fetch(
      `${RENDER_API}/services/${SERVICE_ID}/deploys?limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${renderApiKey}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!deploymentsResponse.ok) {
      const errorText = await deploymentsResponse.text();
      console.error(`❌ Failed to fetch deployments: ${deploymentsResponse.status}`);
      console.error(`Response: ${errorText}`);
      process.exit(1);
    }

    const deployments = await deploymentsResponse.json();
    
    if (deployments.length === 0) {
      console.log('No deployments found');
      process.exit(0);
    }

    deployments.forEach((deploy, index) => {
      console.log(`${index + 1}. Deployment ID: ${deploy.id}`);
      console.log(`   Status: ${deploy.status}`);
      console.log(`   Created: ${deploy.createdAt}`);
      console.log(`   Commit: ${deploy.commit?.substring(0, 8) || 'N/A'}`);
      console.log('');
    });

    // Get logs for the latest deployment
    const latestDeploy = deployments[0];
    if (latestDeploy) {
      console.log(`📜 Fetching logs for latest deployment (${latestDeploy.id})...\n`);
      
      const logsResponse = await fetch(
        `${RENDER_API}/services/${SERVICE_ID}/deploys/${latestDeploy.id}/logs`,
        {
          headers: {
            'Authorization': `Bearer ${renderApiKey}`,
            'Accept': 'application/json',
          },
        }
      );

      if (logsResponse.ok) {
        const logsText = await logsResponse.text();
        console.log('=== DEPLOYMENT LOGS ===');
        console.log(logsText);
        console.log('=== END LOGS ===\n');
      } else {
        console.log('⚠️  Could not fetch logs (logs may still be building)');
      }

      if (latestDeploy.status === 'build_failed') {
        console.log('\n❌ BUILD FAILED');
        console.log('Check the logs above for error details.');
      } else if (latestDeploy.status === 'build_in_progress' || latestDeploy.status === 'deploy_in_progress') {
        console.log('\n⏳ DEPLOYMENT IN PROGRESS');
        console.log('Check back shortly for completion.');
      } else if (latestDeploy.status === 'deactivated') {
        console.log('\n✅ DEPLOYMENT SUCCESSFUL');
        console.log(`Visit: ${service.dashboardUrl}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDeploymentStatus();
