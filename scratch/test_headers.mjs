// Forensic Header Trace
const test = async (label, headers) => {
  console.log(`\n🔍 Testing: ${label}`);
  const url = 'https://api.costloci.com/api/auth/register';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({
        email: `header_test_${Date.now()}@example.com`,
        password: 'securepassword123',
        firstName: 'Header',
        lastName: 'Test'
      })
    });
    const text = await res.text();
    console.log(`   Status: ${res.status}`);
    console.log(`   Body: ${text.substring(0, 100)}`);
  } catch (err) {
    console.error(`   ERROR: ${err.message}`);
  }
};

await test('Standard Headers', {});
await test('With X-Forwarded-Host: www.costloci.com', { 'X-Forwarded-Host': 'www.costloci.com' });
await test('With Host: www.costloci.com', { 'Host': 'www.costloci.com' });
