#!/usr/bin/env node

/**
 * Check Render deployment status using Render API
 * Usage: node check-deployment.js
 */

const fs = require('fs');
const https = require('https');

// Load API key from config
const configPath = './windsurf_mcp_config.json';
let renderApiKey = process.env.RENDER_API_KEY;

if (!renderApiKey && fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const bearerToken = config.mcpServers?.render?.headers?.Authorization;
    if (bearerToken) {
      renderApiKey = bearerToken.replace('Bearer ', '');
    }
  } catch (e) {
    console.error('Error reading config:', e.message);
  }
}

if (!renderApiKey) {
  console.error('❌ Missing RENDER_API_KEY. Set RENDER_API_KEY env var or check windsurf_mcp_config.json');
  process.exit(1);
}

const SERVICE_ID = 'srv-d4a7gq7gi27c739t91i0'; // process-management service
const API_BASE = 'https://api.render.com/v1';

function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${renderApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = https.request(`${API_BASE}${path}`, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function checkDeployment() {
  try {
    console.log('🚀 Checking Render Deployment Status');
    console.log('=====================================\n');

    // Get service details
    console.log('📋 Fetching service details...');
    const serviceRes = await makeRequest(`/services/${SERVICE_ID}`);
    
    if (serviceRes.status !== 200) {
      console.error(`❌ Error: ${serviceRes.status}`);
      console.error(serviceRes.data);
      process.exit(1);
    }

    const service = serviceRes.data;
    console.log('✅ Service found!');
    console.log(`   Name: ${service.name}`);
    console.log(`   Status: ${service.status || 'unknown'}`);
    console.log(`   URL: ${service.serviceDetails?.url || 'N/A'}\n`);

    // Get deployments
    console.log('📦 Fetching recent deployments...');
    const deploymentsRes = await makeRequest(`/services/${SERVICE_ID}/deploys?limit=5`);
    
    if (deploymentsRes.status !== 200) {
      console.error(`❌ Error fetching deployments: ${deploymentsRes.status}`);
      process.exit(1);
    }

    const deploys = deploymentsRes.data?.deploys || [];
    
    if (deploys.length === 0) {
      console.log('⚠️  No deployments found');
      process.exit(0);
    }

    console.log(`✅ Found ${deploys.length} recent deployments\n`);

    // Show latest deployment details
    const latest = deploys[0];
    console.log('📌 Latest Deployment:');
    console.log(`   ID: ${latest.id}`);
    console.log(`   Status: ${latest.status}`);
    console.log(`   Commit: ${latest.commit?.hash?.substring(0, 7) || 'N/A'}`);
    console.log(`   Message: ${latest.commit?.message || 'N/A'}`);
    console.log(`   Created: ${latest.createdAt || 'N/A'}`);
    console.log(`   Updated: ${latest.updatedAt || 'N/A'}\n`);

    if (latest.status === 'build_failed') {
      console.log('❌ BUILD FAILED');
      console.log('   Check the build logs for details');
    } else if (latest.status === 'deploy_failed') {
      console.log('❌ DEPLOYMENT FAILED');
      console.log('   Check the deployment logs for details');
    } else if (latest.status === 'live') {
      console.log('✅ DEPLOYMENT SUCCESSFUL');
      console.log(`   App is live at: ${service.serviceDetails?.url}`);
    } else if (latest.status === 'building') {
      console.log('⏳ BUILDING...');
    } else if (latest.status === 'deploying') {
      console.log('⏳ DEPLOYING...');
    }

    console.log('\n🔗 View in Render Dashboard:');
    console.log(`   https://dashboard.render.com/web/${SERVICE_ID}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDeployment();
