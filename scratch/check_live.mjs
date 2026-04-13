// Check which JS bundle www.costloci.com is serving
const res = await fetch('https://www.costloci.com/');
const html = await res.text();

// Extract JS bundle reference
const match = html.match(/src="(\/assets\/index[^"]+)"/);
console.log('Live JS bundle:', match ? match[1] : 'NOT FOUND');

// Expected new bundle hash 
const EXPECTED = 'index-B_3JwyIM.js';
const isNew = html.includes(EXPECTED);
console.log('Is new bundle live?', isNew ? '✅ YES' : '❌ NO (still old)');

// Check for api.costloci.com reference in the HTML
const hasApiUrl = html.includes('api.costloci.com');
console.log('Has api.costloci.com hardcoded?', hasApiUrl ? '✅ YES' : '❌ NO');

// Also test the /api/ proxy path
const apiRes = await fetch('https://www.costloci.com/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: `check_${Date.now()}@test.com`, password: 'Test1234!', firstName: 'Check', lastName: 'Test' })
});
const apiBody = await apiRes.text();
console.log('\nwww.costloci.com/api proxy test:');
console.log('  Status:', apiRes.status);
console.log('  Content-Type:', apiRes.headers.get('content-type'));
console.log('  Server:', apiRes.headers.get('server'));
console.log('  CF-Ray:', apiRes.headers.get('cf-ray'));
console.log('  Body:', apiBody.substring(0, 100));
