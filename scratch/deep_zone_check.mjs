// Deeper zone forensics - check ALL DNS records and custom domain mapping
const ACCOUNT_ID = '8dc05e6cc0ee7377c2f17f4ff69baec9';
const ZONE_ID = '745455d71d503d23c1c16003b1bf099b';
const API_TOKEN = 'RohDq8oChPFq3z82F58IXXIQY2KrCW7ZydMK5rRA8_w.sQGytrfS8C4HrNxpHXrEBq6fpMso4mFSPpSRuSg8EIA';
const headers = { 'Authorization': `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' };

// All DNS records
const dnsRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`, { headers });
const dnsData = await dnsRes.json();
console.log('=== ALL DNS RECORDS ===');
if (dnsData.success) {
  dnsData.result.forEach(r => {
    console.log(`  ${r.type.padEnd(6)} ${r.name.padEnd(30)} → ${r.content} [proxied=${r.proxied}]`);
  });
}

// Check if www.costloci.com is pointed to Cloudflare Pages
const wwwRecord = dnsData.result?.find(r => r.name === 'www.costloci.com');
console.log('\n=== www.costloci.com DNS RECORD ===');
if (wwwRecord) {
  console.log('Type:', wwwRecord.type);
  console.log('Content:', wwwRecord.content);
  console.log('Proxied (Orange Cloud):', wwwRecord.proxied);
} else {
  console.log('WARNING: No DNS record for www.costloci.com! It may be using a CNAME flattening via root zone.');
}

// Check the root costloci.com record
const rootRecord = dnsData.result?.find(r => r.name === 'costloci.com' && r.type === 'CNAME');
const rootA = dnsData.result?.filter(r => r.name === 'costloci.com');
console.log('\n=== ROOT costloci.com RECORDS ===');
rootA?.forEach(r => console.log(`  ${r.type}: ${r.content} [proxied=${r.proxied}]`));

// Check for any A records pointing to Vercel IPs
const vercelA = dnsData.result?.filter(r => r.content?.includes('76.76.21') || r.content?.includes('76.223'));
if (vercelA?.length) {
  console.log('\nVercel A records:', vercelA.map(r => `${r.name}=${r.content}`));
}

// Check for zone-level routing/transform rules that could remap /api/
const transformRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/rulesets/phases/http_request_transform/entrypoint`, { headers });
const transformData = await transformRes.json();
console.log('\n=== TRANSFORM RULES ===');
console.log(JSON.stringify(transformData, null, 2).substring(0, 500));

// Check URL redirect rules  
const redirectRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/rulesets/phases/http_request_dynamic_redirect/entrypoint`, { headers });
const redirectData = await redirectRes.json();
console.log('\n=== REDIRECT RULES ===');
console.log(JSON.stringify(redirectData, null, 2).substring(0, 500));
