// Check Cloudflare Zone for Worker routes that may be hijacking /api/*
const ACCOUNT_ID = '8dc05e6cc0ee7377c2f17f4ff69baec9';
const API_TOKEN = 'RohDq8oChPFq3z82F58IXXIQY2KrCW7ZydMK5rRA8_w.sQGytrfS8C4HrNxpHXrEBq6fpMso4mFSPpSRuSg8EIA';
const headers = { 'Authorization': `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' };

// First, find the zone ID for costloci.com
const zonesRes = await fetch(`https://api.cloudflare.com/client/v4/zones?name=costloci.com`, { headers });
const zonesData = await zonesRes.json();

if (!zonesData.success || !zonesData.result.length) {
  console.error('Could not find zone:', JSON.stringify(zonesData.errors));
  process.exit(1);
}

const zone = zonesData.result[0];
const ZONE_ID = zone.id;
console.log('Zone ID:', ZONE_ID);
console.log('Zone Name:', zone.name);
console.log('Zone Status:', zone.status);

// Check Worker routes on this zone
const workerRoutesRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/workers/routes`, { headers });
const workerRoutesData = await workerRoutesRes.json();
console.log('\n=== ZONE WORKER ROUTES ===');
if (workerRoutesData.success) {
  if (workerRoutesData.result.length === 0) {
    console.log('No Worker routes found.');
  } else {
    workerRoutesData.result.forEach(r => {
      console.log(`  Pattern: ${r.pattern} → Script: ${r.script || '(none)'}`);
    });
  }
} else {
  console.log('Error:', JSON.stringify(workerRoutesData.errors));
}

// Check Page Rules
const pageRulesRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/pagerules?status=active`, { headers });
const pageRulesData = await pageRulesRes.json();
console.log('\n=== PAGE RULES ===');
if (pageRulesData.success) {
  if (pageRulesData.result.length === 0) {
    console.log('No Page Rules found.');
  } else {
    pageRulesData.result.forEach(r => {
      console.log(`  Target: ${r.targets?.[0]?.constraint?.value}`);
      r.actions?.forEach(a => console.log(`    Action: ${a.id} = ${JSON.stringify(a.value)}`));
    });
  }
}

// Check DNS records for costloci.com
const dnsRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=www.costloci.com`, { headers });
const dnsData = await dnsRes.json();
console.log('\n=== DNS RECORDS FOR www.costloci.com ===');
if (dnsData.success) {
  dnsData.result.forEach(r => {
    console.log(`  Type: ${r.type}, Name: ${r.name}, Content: ${r.content}, Proxy: ${r.proxied}`);
  });
}

// Check Ruleset rules (modern Worker routing)
const rulesetRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/rulesets`, { headers });
const rulesetData = await rulesetRes.json();
console.log('\n=== RULESETS ===');
if (rulesetData.success) {
  rulesetData.result.forEach(r => {
    console.log(`  Name: ${r.name}, Phase: ${r.phase}, Kind: ${r.kind}`);
  });
}
