// Forensic Registration Trace — Tests both possible URL targets
const test = async (label, url) => {
  console.log(`\n🔍 Testing: ${label}`);
  console.log(`   URL: ${url}`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://www.costloci.com',
        'User-Agent': 'Mozilla/5.0 Chrome/120'
      },
      body: JSON.stringify({
        email: `trace_test_${Date.now()}@example.com`,
        password: 'securepassword123',
        firstName: 'Trace',
        lastName: 'Test'
      })
    });
    const text = await res.text();
    console.log(`   Status: ${res.status}`);
    console.log(`   Content-Type: ${res.headers.get('content-type')}`);
    console.log(`   Body (first 200 chars): ${text.substring(0, 200)}`);
    console.log(`   Is JSON: ${text.trim().startsWith('{') || text.trim().startsWith('[')}`);
  } catch (err) {
    console.error(`   ERROR: ${err.message}`);
  }
};

// Test 1: Direct backend (correct)
await test('Direct Backend (api.costloci.com)', 'https://api.costloci.com/api/auth/register');

// Test 2: Via www frontend (what browser sees if VITE_API_URL is empty/wrong)
await test('Via Frontend domain (www.costloci.com)', 'https://www.costloci.com/api/auth/register');

// Test 3: Double prefix (old bug)
await test('Old Double Prefix Bug', 'https://api.costloci.com/api/api/auth/register');
