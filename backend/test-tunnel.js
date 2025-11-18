// Test script to verify tunnel connection
const https = require('https');

const tunnelUrl = 'user.bsciam.me';

console.log('Testing connection to:', tunnelUrl);
console.log('---\n');

// Test health endpoint
const testHealth = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: tunnelUrl,
      path: '/health',
      method: 'GET',
      headers: {
        'User-Agent': 'BSCIAM-Test-Client'
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      console.log(`✅ Health Check Status: ${res.statusCode}`);
      console.log(`Headers:`, JSON.stringify(res.headers, null, 2));
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Response: ${data}`);
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
};

// Test API endpoint
const testAPI = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: tunnelUrl,
      path: '/api/files?walletAddress=0x0000000000000000000000000000000000000000',
      method: 'GET',
      headers: {
        'User-Agent': 'BSCIAM-Test-Client',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      console.log(`\n✅ API Test Status: ${res.statusCode}`);
      console.log(`Headers:`, JSON.stringify(res.headers, null, 2));
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Response: ${data}`);
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
};

// Run tests
(async () => {
  try {
    console.log('1. Testing Health Endpoint...');
    await testHealth();
    
    console.log('\n2. Testing API Endpoint...');
    await testAPI();
    
    console.log('\n✅ Connection test completed successfully!');
    console.log('\nYour tunnel is working correctly!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('1. Make sure backend server is running: cd backend && npm start');
    console.log('2. Verify backend is listening on port 3001');
    console.log('3. Check Cloudflare Tunnel is running: cloudflared tunnel run <tunnel-name>');
    console.log('4. Verify tunnel config points to http://localhost:3001');
    console.log('5. Check tunnel logs for connection errors');
  }
})();

