import { adminClient as supabase } from '../server/services/supabase';

async function migrate() {
  console.log("🚀 Starting Phase 15 Data Migration: Workspace Membership Sync (SDK Mode)...");

  try {
    // 1. Fetch all workspaces that have an owner set
    const { data: workspaces, error: wsError } = await supabase
      .from('workspaces')
      .select('id, owner_id')
      .not('owner_id', 'is', null);

    if (wsError) throw wsError;
    
    console.log(`📡 Found ${workspaces.length} workspaces to migrate.`);

    for (const ws of workspaces) {
      // 2. Check if the owner is already in the workspace_members table
      const { data: existing, error: eError } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', ws.id)
        .eq('user_id', ws.owner_id);

      if (eError) throw eError;

      if (!existing || existing.length === 0) {
        console.log(`🛠️  Migrating workspace #${ws.id}: Granting owner role to ${ws.owner_id}`);
        const { error: iError } = await supabase
          .from('workspace_members')
          .insert({
            workspace_id: ws.id,
            user_id: ws.owner_id,
            role: 'owner'
          });
        
        if (iError) throw iError;
      } else {
        console.log(`✅ Workspace #${ws.id} already has a designated owner membership.`);
      }
    }

    console.log("🏆 Migration Success: All workspace owners are now multi-tenant compliant.");
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
}

migrate();
