// Simple API test using built-in http module
const http = require('http');

// Test root endpoint
function testRoot() {
  console.log('\nTesting root endpoint (/)...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET',
    timeout: 3000
  };
  
  const req = http.request(options, (res) => {
    console.log(`Response status: ${res.statusCode} ${res.statusMessage}`);
    
    // We got a response, now test API ping
    setTimeout(() => testApiPing(), 500);
  });
  
  req.on('error', (error) => {
    console.error('Error testing root endpoint:', error.message);
    console.log('Server may not be running. Please make sure Next.js is running on port 3000.');
  });
  
  req.on('timeout', () => {
    console.error('Connection timed out when testing root endpoint');
    req.destroy();
  });
  
  req.end();
}

// Test API ping endpoint
function testApiPing() {
  console.log('\nTesting API ping endpoint (/api/ping)...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/ping',
    method: 'GET',
    timeout: 3000
  };
  
  const req = http.request(options, (res) => {
    console.log(`Response status: ${res.statusCode} ${res.statusMessage}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('Response data:', jsonData);
      } catch (e) {
        console.log('Raw response:', data);
      }
      
      // Next, test the proxy
      setTimeout(() => testApiProxy(), 500);
    });
  });
  
  req.on('error', (error) => {
    console.error('Error testing API ping:', error.message);
    setTimeout(() => testApiProxy(), 500); // Try the proxy endpoint anyway
  });
  
  req.on('timeout', () => {
    console.error('Connection timed out when testing API ping');
    req.destroy();
    setTimeout(() => testApiProxy(), 500); // Try the proxy endpoint anyway
  });
  
  req.end();
}

// Test API proxy endpoint
function testApiProxy() {
  console.log('\nTesting API proxy endpoint (/api/proxy)...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/proxy?endpoint=posts.json&limit=1&tags=safe',
    method: 'GET',
    timeout: 5000
  };
  
  const req = http.request(options, (res) => {
    console.log(`Response status: ${res.statusCode} ${res.statusMessage}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('Response data (truncated):', JSON.stringify(jsonData).substring(0, 100) + '...');
      } catch (e) {
        console.log('Raw response (truncated):', data.substring(0, 100) + '...');
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('Error testing API proxy:', error.message);
  });
  
  req.on('timeout', () => {
    console.error('Connection timed out when testing API proxy');
    req.destroy();
  });
  
  req.end();
}

// Start the tests
testRoot();