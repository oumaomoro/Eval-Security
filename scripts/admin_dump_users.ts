import { storage } from "../server/storage";
import { storageContext } from "../server/services/storageContext";

async function dumpUsers() {
  console.log("🔍 Dumping Users Table...");
  try {
    // Attempt to access the raw supabase client from storage
    const { adminClient } = await import("../server/services/supabase.js");
    const { data: users, error } = await adminClient.from("users").select("id, username, role");
    
    if (error) throw error;

    console.log(`✅ Total Users: ${users.length}`);
    users.forEach(u => console.log(`   - [${u.id}] ${u.username} (${u.role})`));

    const testUser = users.find(u => u.username === 'testuser');
    if (testUser) {
        // Find their workspace
        const { data: members, error: mErr } = await adminClient.from("workspace_members").select("workspace_id").eq("user_id", testUser.id);
        if (mErr) throw mErr;
        console.log(`✅ testuser belongs to Workspaces: ${members.map(m => m.workspace_id).join(", ")}`);
    } else {
        console.error("❌ 'testuser' is missing from the DB.");
    }
  } catch (err: any) {
    console.error("❌ Dump failed:", err.message);
  }
}

dumpUsers();
