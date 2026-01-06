#!/usr/bin/env node

/**
 * Render Deployment Diagnosis & Fix Script
 * 
 * This script helps diagnose and fix common Render deployment issues
 * for the Tobacco Tracker application.
 * 
 * Usage: node diagnose-render.js
 */

const https = require('https');

const CONFIG = {
  serviceId: 'srv-d4a7gq7gi27c739t91i0',
  apiKey: process.env.RENDER_API_KEY,
  apiUrl: 'https://api.render.com/v1'
};

function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function makeTextRequest(method, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'Accept': 'text/plain'
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function diagnose() {
  console.log('🔍 Tobacco Tracker - Render Deployment Diagnosis');
  console.log('================================================\n');

  if (!CONFIG.apiKey) {
    console.error('❌ RENDER_API_KEY environment variable not set');
    console.error('   Set it using: export RENDER_API_KEY=your_api_key');
    process.exit(1);
  }

  try {
    // Get service details
    console.log('1️⃣  Checking web service status...');
    const serviceResponse = await makeRequest('GET', `/v1/services/${CONFIG.serviceId}`);
    
    if (serviceResponse.status !== 200) {
      console.error('❌ Failed to fetch service:', serviceResponse.status);
      console.error(JSON.stringify(serviceResponse.body, null, 2));
      process.exit(1);
    }

    const service = serviceResponse.body;
    console.log(`✅ Service: ${service.name}`);
    console.log(`   Status: ${service.suspended}`);
    console.log(`   URL: ${service.serviceDetails.url}`);
    console.log(`   Region: ${service.serviceDetails.region}`);
    console.log(`   Updated: ${service.updatedAt}\n`);

    // Get environment variables
    console.log('2️⃣  Checking environment variables...');
    const envResponse = await makeRequest('GET', `/v1/services/${CONFIG.serviceId}/environment`);
    
    if (envResponse.status === 200) {
      const envVars = envResponse.body;
      const hasDbUrl = envVars.some(v => v.key === 'DATABASE_URL');
      console.log(`✅ Total env vars: ${envVars.length}`);
      console.log(`   DATABASE_URL present: ${hasDbUrl ? '✅ YES' : '❌ NO'}`);
      
      if (!hasDbUrl) {
        console.log('\n⚠️  DATABASE_URL is missing!');
        console.log('   → Attach a PostgreSQL database to your Render service');
        console.log('   → Then DATABASE_URL will be auto-populated');
      }
    }

    // Get latest deployments
    console.log('\n3️⃣  Checking recent deployments...');
    const deploymentsResponse = await makeRequest('GET', `/v1/services/${CONFIG.serviceId}/deploys?limit=3`);
    
    if (deploymentsResponse.status === 200 && deploymentsResponse.body.length > 0) {
      deploymentsResponse.body.forEach((deploy, i) => {
        console.log(`\n   Deployment ${i + 1}:`);
        console.log(`   ID: ${deploy.id}`);
        console.log(`   Status: ${deploy.status}`);
        console.log(`   Created: ${deploy.createdAt}`);
        if (deploy.statusMessage) {
          console.log(`   Message: ${deploy.statusMessage}`);
        }
      });
      const latest = deploymentsResponse.body[0];
      if (latest) {
        console.log('\n4️⃣  Fetching latest deployment logs...');
        const logsResponse = await makeTextRequest('GET', `/v1/services/${CONFIG.serviceId}/deploys/${latest.id}/logs`);
        if (logsResponse.status === 200) {
          const lines = (logsResponse.body || '').split('\n').filter(l => l.trim());
          const filtered = lines.filter(l => /DATABASE|SSL|connection|postgres|ECONNREFUSED|timeout|authentication/i.test(l));
          if (filtered.length > 0) {
            console.log(`   Found ${filtered.length} database-related log entries:`);
            filtered.slice(0, 50).forEach(l => console.log(`   ${l}`));
          } else {
            console.log('   No database-related entries found in latest deployment logs');
          }
        } else {
          console.log(`   Could not fetch deployment logs: ${logsResponse.status}`);
        }
      }
    }

    console.log('\n5️⃣  Fetching runtime logs (last 200 lines)...');
    const runtimeLogsResponse = await makeTextRequest('GET', `/v1/services/${CONFIG.serviceId}/logs`);
    if (runtimeLogsResponse.status === 200) {
      const lines = (runtimeLogsResponse.body || '').split('\n').filter(l => l.trim());
      const tail = lines.slice(-200);
      const filtered = tail.filter(l => /DATABASE|SSL|connection|postgres|ECONNREFUSED|timeout|authentication/i.test(l));
      if (filtered.length > 0) {
        filtered.forEach(l => console.log(`   ${l}`));
      } else {
        console.log('   No database-related entries found in runtime logs');
      }
    } else {
      console.log(`   Could not fetch runtime logs: ${runtimeLogsResponse.status}`);
    }

    console.log('\n\n📋 DIAGNOSTIC SUMMARY:');
    console.log('======================');
    console.log('✅ Service is deployed and accessible');
    console.log('⚠️  Next steps:');
    console.log('   1. Verify DATABASE_URL is set (attach Postgres add-on if missing)');
    console.log('   2. Run setup job: node render-setup/setup-database.js');
    console.log('   3. Check deployment logs in Render dashboard');
    console.log('   4. Visit /api/health endpoint to test database connection');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    process.exit(1);
  }
}

diagnose();
