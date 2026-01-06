#!/usr/bin/env node

/**
 * Check Render service database connectivity
 * Uses Render API to check the deployed service status, env vars, and logs
 */

import fetch from 'node-fetch';
import fs from 'fs';

// Load API key from MCP config or environment
const configPath = './windsurf_mcp_config.json';
let apiKey = process.env.RENDER_API_KEY;

if (!apiKey && fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const bearerToken = config.mcpServers?.render?.headers?.Authorization;
    if (bearerToken) {
      apiKey = bearerToken.replace('Bearer ', '');
    }
  } catch (error) {
    console.error('Error reading config:', error.message);
  }
}

if (!apiKey) {
  console.error('❌ Missing RENDER_API_KEY. Set RENDER_API_KEY env var or ensure windsurf_mcp_config.json exists.');
  process.exit(1);
}

const SERVICE_ID = 'srv-d4a7gq7gi27c739t91i0';
const RENDER_API = 'https://api.render.com/v1';

async function checkService() {
  try {
    console.log('🔍 Checking Render Service Database Connectivity\n');
    console.log('='.repeat(60));

    // 1. Service Status
    console.log('\n1️⃣  Service Status:');
    const serviceRes = await fetch(`${RENDER_API}/services/${SERVICE_ID}`, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' }
    });
    
    if (serviceRes.ok) {
      const service = await serviceRes.json();
      console.log(`   Name: ${service.name}`);
      console.log(`   URL: ${service.serviceDetails?.url || 'N/A'}`);
      console.log(`   Status: ${service.suspended === 'not_suspended' ? '✅ Running' : '❌ Suspended'}`);
      console.log(`   Region: ${service.serviceDetails?.region || 'N/A'}`);
    } else {
      console.log(`   ❌ Failed: ${serviceRes.status}`);
      return;
    }

    // 2. Environment Variables - Check DATABASE_URL
    console.log('\n2️⃣  Environment Variables:');
    const envRes = await fetch(`${RENDER_API}/services/${SERVICE_ID}/environment`, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' }
    });

    if (envRes.ok) {
      const envVars = await envRes.json();
      const dbUrl = envVars.find(v => v.key === 'DATABASE_URL');
      
      if (dbUrl) {
        console.log(`   DATABASE_URL: ✅ Present`);
        const url = dbUrl.value;
        const isRender = url.includes('render.com');
        console.log(`   Type: ${isRender ? '✅ Render Postgres' : '⚠️ External Database'}`);
        console.log(`   Preview: ${url.substring(0, 60)}...`);
      } else {
        console.log(`   DATABASE_URL: ❌ MISSING`);
        console.log(`   ⚠️  This is the issue!`);
        console.log(`   Solution: Attach a PostgreSQL database to your service in Render dashboard`);
      }
    } else {
      console.log(`   ⚠️  Could not fetch env vars: ${envRes.status}`);
    }

    // 3. Latest Deployment Logs
    console.log('\n3️⃣  Latest Deployment:');
    const deploysRes = await fetch(`${RENDER_API}/services/${SERVICE_ID}/deploys?limit=1`, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' }
    });

    if (deploysRes.ok) {
      const deployments = await deploysRes.json();
      if (deployments.length > 0) {
        const deploy = deployments[0];
        console.log(`   ID: ${deploy.id}`);
        console.log(`   Status: ${deploy.status}`);
        console.log(`   Created: ${new Date(deploy.createdAt).toLocaleString()}`);
        
        // Get logs
        console.log('\n4️⃣  Deployment Logs (database-related):');
        const logsRes = await fetch(`${RENDER_API}/services/${SERVICE_ID}/deploys/${deploy.id}/logs`, {
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' }
        });

        if (logsRes.ok) {
          const logs = await logsRes.text();
          const lines = logs.split('\n');
          const dbLines = lines.filter(l => 
            /DATABASE|SSL|connection|postgres|ECONNREFUSED|timeout|authentication/i.test(l)
          );
          
          if (dbLines.length > 0) {
            console.log(`   Found ${dbLines.length} database-related log entries:\n`);
            dbLines.slice(0, 15).forEach(line => {
              if (line.trim()) console.log(`   ${line}`);
            });
          } else {
            console.log(`   ✅ No database errors in deployment logs`);
          }
        }
      }
    }

    // 4. Runtime Logs
    console.log('\n5️⃣  Runtime Logs (database-related, last 20 lines):');
    const runtimeLogsRes = await fetch(`${RENDER_API}/services/${SERVICE_ID}/logs`, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' }
    });

    if (runtimeLogsRes.ok) {
      const logs = await runtimeLogsRes.text();
      const lines = logs.split('\n').filter(l => l.trim());
      const dbLines = lines.filter(l => 
        /DATABASE|SSL|connection|postgres|ECONNREFUSED|timeout|authentication/i.test(l)
      );
      
      if (dbLines.length > 0) {
        dbLines.slice(-20).forEach(line => {
          if (line.trim()) console.log(`   ${line}`);
        });
      } else {
        console.log(`   ✅ No database errors in runtime logs`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📋 Summary:');
    console.log('='.repeat(60));
    console.log('✅ Database connectivity fixes applied to code:');
    console.log('   - SSL configuration for Render Postgres');
    console.log('   - Connection pool settings');
    console.log('   - Updated render-setup script');
    console.log('\n💡 Next Steps:');
    console.log('   1. Ensure DATABASE_URL is set in Render environment variables');
    console.log('   2. Deploy the updated code');
    console.log('   3. Check /api/health endpoint after deployment');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

checkService();
