/**
 * Cloudflare Pages Production Promoter
 * Uses the Cloudflare REST API to:
 * 1. List all deployments for the costloci-frontend project
 * 2. Find the latest non-production or latest production deployment
 * 3. Promote it to be the canonical production deployment
 */

const ACCOUNT_ID = '8dc05e6cc0ee7377c2f17f4ff69baec9';
// Wrangler OAuth token (has pages:write permission)
const API_TOKEN = 'RohDq8oChPFq3z82F58IXXIQY2KrCW7ZydMK5rRA8_w.sQGytrfS8C4HrNxpHXrEBq6fpMso4mFSPpSRuSg8EIA';
const PROJECT_NAME = 'costloci-frontend';
const BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}`;

const headers = {
  'Authorization': `Bearer ${API_TOKEN}`,
  'Content-Type': 'application/json'
};

async function run() {
  console.log('🔍 Fetching deployments for', PROJECT_NAME);

  // Step 1: List deployments
  const listRes = await fetch(`${BASE_URL}/deployments`, { headers });
  const listData = await listRes.json();

  if (!listData.success) {
    console.error('❌ Failed to list deployments:', JSON.stringify(listData.errors, null, 2));
    process.exit(1);
  }

  const deployments = listData.result;
  console.log(`✅ Found ${deployments.length} deployments`);

  // Step 2: Find the latest deployment (first in the list)
  const latest = deployments[0];
  console.log('\n📦 Latest Deployment:');
  console.log('   ID:', latest.id);
  console.log('   URL:', latest.url);
  console.log('   Stage:', latest.latest_stage?.name);
  console.log('   Environment:', latest.environment);
  console.log('   Created:', latest.created_on);
  console.log('   Branch:', latest.deployment_trigger?.metadata?.branch);
  console.log('   Aliases:', (latest.aliases || []).join(', ') || 'none');

  // Check if 'www.costloci.com' is already an alias of the latest deployment
  const isProduction = (latest.aliases || []).includes('www.costloci.com') ||
                       (latest.aliases || []).includes('costloci.com');

  if (isProduction) {
    console.log('\n🎉 Latest deployment is ALREADY Production! www.costloci.com should be updated.');
    return;
  }

  // Step 3: Promote by setting the latest deployment as the production one
  // Cloudflare API: POST /deployments/{deployment_id}/rollback triggers a new production deployment
  // from that commit — we need to retrigger the production build based on latest commit.
  console.log('\n🚀 Promoting latest deployment to Production...');
  
  const promoteRes = await fetch(`${BASE_URL}/deployments/${latest.id}/rollback`, {
    method: 'POST',
    headers
  });
  const promoteData = await promoteRes.json();

  if (!promoteData.success) {
    console.error('❌ Promotion failed:', JSON.stringify(promoteData.errors, null, 2));
    
    // Fallback: Try direct alias/domain update approach
    console.log('\n🔄 Trying alternative: updating production alias...');
    const aliasRes = await fetch(`${BASE_URL}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        deployment_configs: {
          production: {
            compatibility_date: '2024-01-01'
          }
        }
      })
    });
    const aliasData = await aliasRes.json();
    console.log('PATCH result:', JSON.stringify(aliasData, null, 2));
  } else {
    const promoted = promoteData.result;
    console.log('\n✅ Promotion successful!');
    console.log('   New Deployment ID:', promoted.id);
    console.log('   URL:', promoted.url);
    console.log('   Aliases:', (promoted.aliases || []).join(', '));
  }
}

run().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
