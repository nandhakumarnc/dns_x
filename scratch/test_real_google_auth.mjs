import fs from 'fs';

async function testBackendAuthEndpoint() {
  console.log('--- 1. Testing Backend Auth Endpoint (/api/v1/auth/verify-google) ---');
  const baseUrl = 'http://localhost:3001/api/v1/auth/verify-google';
  const headers = {
    'Content-Type': 'application/json',
    'X-Api-Key': 'dnsx_dev_secret_key_8f3d6b2c9e1a4705',
  };

  // Test 1: Empty input
  const res1 = await fetch(baseUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email: '' }),
  });
  console.log('Test 1 (Empty input) Status:', res1.status, '(expected 400)');
  if (res1.status !== 400) throw new Error('Empty input should return 400');

  // Test 2: Whitespace only
  const res2 = await fetch(baseUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email: '    ' }),
  });
  console.log('Test 2 (Whitespace only) Status:', res2.status, '(expected 400)');
  if (res2.status !== 400) throw new Error('Whitespace input should return 400');

  // Test 3: Non-Google domain (e.g. yahoo.com)
  const res3 = await fetch(baseUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email: 'user@yahoo.com' }),
  });
  const data3 = await res3.json();
  console.log('Test 3 (Non-Google domain) Status:', res3.status, 'Error:', data3.error);
  if (res3.status !== 400 || data3.verified !== false) {
    throw new Error('Non-Google domain should be rejected with 400');
  }

  // Test 4: Fake non-existent domain
  const res4 = await fetch(baseUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email: 'user@fake-nonexistent-domain-837492.com' }),
  });
  const data4 = await res4.json();
  console.log('Test 4 (Fake domain) Status:', res4.status, 'Error:', data4.error);
  if (res4.status !== 400 || data4.verified !== false) {
    throw new Error('Fake domain should return 400');
  }

  // Test 5: Invalid short Gmail username (<6 chars)
  const res5 = await fetch(baseUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email: 'ab@gmail.com' }),
  });
  const data5 = await res5.json();
  console.log('Test 5 (Short username) Status:', res5.status, 'Error:', data5.error);
  if (res5.status !== 400 || data5.verified !== false) {
    throw new Error('Short username should return 400');
  }

  // Test 6: Valid Google account (@gmail.com)
  const res6 = await fetch(baseUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email: 'network.engineer99@gmail.com' }),
  });
  const data6 = await res6.json();
  console.log('Test 6 (Valid Gmail) Status:', res6.status, 'Verified:', data6.verified, 'User:', data6.user?.email);
  if (res6.status !== 200 || !data6.verified) {
    throw new Error('Valid Gmail should return 200 with verified: true');
  }

  // Test 7: Valid Google Workspace domain (@google.com)
  const res7 = await fetch(baseUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email: 'admin@google.com' }),
  });
  const data7 = await res7.json();
  console.log('Test 7 (Valid Google Workspace) Status:', res7.status, 'Verified:', data7.verified, 'AccountType:', data7.user?.accountType);
  if (res7.status !== 200 || !data7.verified || data7.user?.accountType !== 'workspace') {
    throw new Error('Valid Google Workspace domain should return 200 with accountType: workspace');
  }

  console.log('ALL BACKEND VERIFICATION TESTS PASSED!\n');
}

async function run() {
  await testBackendAuthEndpoint();
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
