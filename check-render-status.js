const https = require('https');

function checkRenderStatus() {
  const options = {
    hostname: 'api.render.com',
    path: '/v1/services/srv-d4a7gq7gi27c739t91i0',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer rnd_6hXnr0R9l8HwJE16nzq5vgsGvAfW',
      'Accept': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const service = JSON.parse(data);
        console.log('\n✅ SERVICE STATUS');
        console.log('================');
        console.log(`Name: ${service.name}`);
        console.log(`Status: ${service.suspended === 'not_suspended' ? '🟢 Running' : '🔴 Suspended'}`);
        console.log(`URL: ${service.serviceDetails?.url}`);
        console.log(`Region: ${service.serviceDetails?.region}`);
        console.log(`Updated: ${service.updatedAt}\n`);
        
        // Check latest deployment
        checkLatestDeployment();
      } catch (e) {
        console.error('❌ Error parsing response:', e.message);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Request error:', e.message);
  });
  req.end();
}

function checkLatestDeployment() {
  const options = {
    hostname: 'api.render.com',
    path: '/v1/services/srv-d4a7gq7gi27c739t91i0/deploys?limit=1',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer rnd_6hXnr0R9l8HwJE16nzq5vgsGvAfW',
      'Accept': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const deploys = JSON.parse(data);
        if (deploys && deploys.length > 0) {
          const deploy = deploys[0];
          console.log('📋 LATEST DEPLOYMENT');
          console.log('===================');
          console.log(`Status: ${deploy.status}`);
          console.log(`Created: ${deploy.createdAt}`);
          console.log(`Finished: ${deploy.finishedAt || 'In Progress...'}\n`);
        }
      } catch (e) {
        console.error('❌ Error parsing deployment:', e.message);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Deployment request error:', e.message);
  });
  req.end();
}

checkRenderStatus();
