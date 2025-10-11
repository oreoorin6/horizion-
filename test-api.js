// Test script for the API proxy
// For Node.js 18+ use built-in fetch, otherwise we need to import it
let fetch;
try {
  fetch = globalThis.fetch || require('node-fetch');
} catch (e) {
  // If node-fetch is not installed
  console.log('Installing node-fetch...');
  require('child_process').execSync('npm install --save node-fetch');
  fetch = require('node-fetch');
}

// Test the API ping endpoint
async function testApiPing() {
  try {
    console.log('Testing API ping endpoint...');
    const response = await fetch('http://localhost:3000/api/ping');
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);
    } else {
      console.error('Error response:', response.statusText);
    }
  } catch (error) {
    console.error('Error testing API ping:', error.message);
  }
}

// Test the API proxy endpoint
async function testApiProxy() {
  try {
    console.log('Testing API proxy endpoint...');
    const response = await fetch('http://localhost:3000/api/proxy?endpoint=posts.json&limit=1&tags=safe');
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);
    } else {
      console.error('Error response:', response.statusText);
    }
  } catch (error) {
    console.error('Error testing API proxy:', error.message);
  }
}

// Run tests
async function runTests() {
  await testApiPing();
  console.log('\n---\n');
  await testApiProxy();
}

runTests();