import { SpawnOptionsWithoutStdio } from 'child_process';

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;
const ADMIN_TOKEN = 'test-secret-admin-token';

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('--- STARTING FEEDBACK API VERIFICATION TESTS ---');
  
  // Set ADMIN_TOKEN env var for testing
  process.env.ADMIN_TOKEN = ADMIN_TOKEN;

  // Test 1: POST validation checks (missing message)
  console.log('\n[Test 1] POST feedback with missing message...');
  try {
    const res = await fetch(`${BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'Bug',
        email: 'test@example.com',
        rating: 5,
        pagePath: '/test-page',
        userAgent: 'test-agent'
      })
    });
    
    const body = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${JSON.stringify(body)}`);
    if (res.status === 400 && body.error.includes('Message is required')) {
      console.log('✅ Test 1 Passed: Validation caught missing message.');
    } else {
      console.log('❌ Test 1 Failed.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test 1 failed with error:', err);
    process.exit(1);
  }

  // Test 2: POST validation checks (invalid category)
  console.log('\n[Test 2] POST feedback with invalid category...');
  try {
    const res = await fetch(`${BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'AwfulCategory',
        message: 'This is a test message',
        pagePath: '/test-page',
        userAgent: 'test-agent'
      })
    });
    
    const body = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${JSON.stringify(body)}`);
    if (res.status === 400 && body.error.includes('Category must be one of')) {
      console.log('✅ Test 2 Passed: Validation caught invalid category.');
    } else {
      console.log('❌ Test 2 Failed.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test 2 failed with error:', err);
    process.exit(1);
  }

  // Test 3: POST validation checks (invalid rating)
  console.log('\n[Test 3] POST feedback with invalid rating...');
  try {
    const res = await fetch(`${BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'Bug',
        message: 'This is a test message',
        rating: 6, // invalid
        pagePath: '/test-page',
        userAgent: 'test-agent'
      })
    });
    
    const body = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${JSON.stringify(body)}`);
    if (res.status === 400 && body.error.includes('Rating must be an integer between 1 and 5')) {
      console.log('✅ Test 3 Passed: Validation caught invalid rating.');
    } else {
      console.log('❌ Test 3 Failed.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test 3 failed with error:', err);
    process.exit(1);
  }

  // Test 4: POST valid feedback
  console.log('\n[Test 4] POST valid feedback...');
  let feedbackId: any = null;
  try {
    const res = await fetch(`${BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'Bug',
        message: 'This is a valid test bug report message!',
        email: 'test-bug@example.com',
        rating: 4,
        pagePath: '/test-page',
        userAgent: 'test-agent'
      })
    });
    
    const body = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${JSON.stringify(body)}`);
    if (res.status === 201 && body.id) {
      feedbackId = body.id;
      console.log(`✅ Test 4 Passed: Saved feedback successfully (ID: ${feedbackId}).`);
    } else {
      console.log('❌ Test 4 Failed.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test 4 failed with error:', err);
    process.exit(1);
  }

  // Test 5: GET feedback without Auth
  console.log('\n[Test 5] GET feedback without Authorization...');
  try {
    const res = await fetch(`${BASE_URL}/api/feedback`);
    const body = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${JSON.stringify(body)}`);
    if (res.status === 401 && body.error.includes('Missing or invalid Authorization')) {
      console.log('✅ Test 5 Passed: Unauthorized request blocked.');
    } else {
      console.log('❌ Test 5 Failed.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test 5 failed with error:', err);
    process.exit(1);
  }

  // Test 6: GET feedback with invalid token
  console.log('\n[Test 6] GET feedback with invalid token...');
  try {
    const res = await fetch(`${BASE_URL}/api/feedback`, {
      headers: {
        'Authorization': 'Bearer wrong-token-value'
      }
    });
    const body = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${JSON.stringify(body)}`);
    if (res.status === 401 && body.error.includes('Invalid admin token')) {
      console.log('✅ Test 6 Passed: Invalid token rejected.');
    } else {
      console.log('❌ Test 6 Failed.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test 6 failed with error:', err);
    process.exit(1);
  }

  // Test 7: GET feedback with valid token
  console.log('\n[Test 7] GET feedback with valid token...');
  try {
    const res = await fetch(`${BASE_URL}/api/feedback`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });
    const body = await res.json() as any[];
    console.log(`Status: ${res.status}`);
    console.log(`Feedback count: ${body.length}`);
    
    // Find our submitted feedback in the retrieved list
    const found = body.find(item => item.email === 'test-bug@example.com');
    if (res.status === 200 && Array.isArray(body) && found) {
      console.log(`Found item in retrieved list: ${JSON.stringify(found)}`);
      console.log('✅ Test 7 Passed: Successfully retrieved feedback with auth token.');
    } else {
      console.log('❌ Test 7 Failed.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test 7 failed with error:', err);
    process.exit(1);
  }

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
  process.exit(0);
}

// Spin up server and run tests
const { spawn } = require('child_process');

console.log(`Starting Next.js dev server on port ${PORT}...`);
const server = spawn('npm', ['run', 'dev', '--', '-p', PORT.toString()], {
  cwd: '/Users/macjayam/workspace/college-research',
  env: { 
    ...process.env, 
    ADMIN_TOKEN, 
    PORT: PORT.toString(),
    // Unset external DB URLs to test in-memory fallback first
    FEEDBACK_DB_URL: '',
    POSTGRES_URL: ''
  },
  shell: true
});

let stdout = '';
server.stdout.on('data', (data: any) => {
  const output = data.toString();
  stdout += output;
  // Log server messages to see what's happening
  if (output.includes('Ready') || output.includes('started') || output.includes('Local:')) {
    console.log(`Server logs: ${output.trim()}`);
  }
});

server.stderr.on('data', (data: any) => {
  console.error(`Server error logs: ${data.toString().trim()}`);
});

server.on('close', (code: any) => {
  console.log(`Server process exited with code ${code}`);
});

// Wait for server to start, then run tests
(async () => {
  await delay(8000); // Wait 8 seconds for dev server startup
  try {
    await runTests();
  } catch (err) {
    console.error(err);
  } finally {
    server.kill();
  }
})();
