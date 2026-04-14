/**
 * Forensic: Check which deployment is actually mapped to www.costloci.com
 * and force-promote the latest one via API rollback trick
 */

const ACCOUNT_ID = '8dc05e6cc0ee7377c2f17f4ff69baec9';
const API_TOKEN = 'RohDq8oChPFq3z82F58IXXIQY2KrCW7ZydMK5rRA8_w.sQGytrfS8C4HrNxpHXrEBq6fpMso4mFSPpSRuSg8EIA';
const PROJECT_NAME = 'costloci-frontend';
const BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}`;

const headers = {
  'Authorization': `Bearer ${API_TOKEN}`,
  'Content-Type': 'application/json'
};

async function run() {
  // Get full project info
  const res = await fetch(BASE_URL, { headers });
  const data = await res.json();
  
  if (!data.success) {
    console.error('Error:', JSON.stringify(data.errors));
    process.exit(1);
  }

  const project = data.result;
  console.log('=== PROJECT INFO ===');
  console.log('Name:', project.name);
  console.log('Production Branch:', project.production_branch);
  console.log('Canonical Deployment ID:', project.canonical_deployment?.id);
  console.log('Canonical Deployment URL:', project.canonical_deployment?.url);
  console.log('Canonical Deployment Aliases:', project.canonical_deployment?.aliases);
  console.log('Latest Deployment ID:', project.latest_deployment?.id);
  console.log('Latest Deployment URL:', project.latest_deployment?.url);
  console.log('Latest Deployment Aliases:', project.latest_deployment?.aliases);
  
  // Now get full deployment list to cross check
  const listRes = await fetch(`${BASE_URL}/deployments`, { headers });
  const listData = await listRes.json();
  const deployments = listData.result;
  
  // find which deployment has www.costloci.com as alias
  const liveDeployment = deployments.find(d => 
    (d.aliases || []).some(a => a.includes('www.costloci.com') || a.includes('costloci.com'))
  );
  
  console.log('\n=== DOMAIN MAPPING ===');
  if (liveDeployment) {
    console.log('www.costloci.com is mapped to deployment:', liveDeployment.id);
    console.log('URL:', liveDeployment.url);
    console.log('Created:', liveDeployment.created_on);
  } else {
    console.log('WARNING: No deployment has www.costloci.com as alias!');
    // Print first 3 deployments for debug
    deployments.slice(0, 3).forEach(d => {
      console.log(`  ID: ${d.id}, Aliases: ${JSON.stringify(d.aliases)}, Env: ${d.environment}`);
    });
  }

  // The LATEST deployment (should be 505f5c82)
  const latest = deployments[0];
  console.log('\n=== LATEST DEPLOYMENT (what should be live) ===');
  console.log('ID:', latest.id);
  console.log('URL:', latest.url);
  console.log('Aliases:', JSON.stringify(latest.aliases));
  console.log('Created:', latest.created_on);

  // Promote: rollback to the SECOND-latest, then back to latest 
  // to force Cloudflare to push the latest to www.costloci.com
  if (deployments.length >= 2) {
    const secondLatest = deployments[1];
    console.log('\n=== FORCE PROMOTION TRICK ===');
    console.log('Step 1: Rolling back to second-latest:', secondLatest.id);
    const rb1 = await fetch(`${BASE_URL}/deployments/${secondLatest.id}/rollback`, {
      method: 'POST', headers
    });
    const rb1Data = await rb1.json();
    if (!rb1Data.success) {
      console.log('Rollback 1 failed:', JSON.stringify(rb1Data.errors));
    } else {
      console.log('Rollback 1 success! New deployment ID:', rb1Data.result?.id);
      
      // Now rollback to latest
      await new Promise(r => setTimeout(r, 3000));
      console.log('Step 2: Rolling back to latest:', latest.id);
      const rb2 = await fetch(`${BASE_URL}/deployments/${latest.id}/rollback`, {
        method: 'POST', headers
      });
      const rb2Data = await rb2.json();
      if (!rb2Data.success) {
        console.log('Rollback 2 failed:', JSON.stringify(rb2Data.errors));
      } else {
        console.log('Rollback 2 success! Production is now at:', rb2Data.result?.id);
      }
    }
  }
}

run().catch(err => console.error('Fatal:', err.message));
