import { storage } from "../server/storage";

async function findWorkspace() {
  console.log("🔍 Looking for testuser's workspace...");
  try {
    const users = await storage.getUsers(); // Assuming this exists or I'll use direct supabase
    const testUser = users.find(u => u.username === 'testuser');
    
    if (!testUser) {
      console.error("❌ 'testuser' not found in database.");
      return;
    }

    console.log(`✅ Found user: ${testUser.username} (ID: ${testUser.id})`);
    
    // Check workspaces
    const workspaces = await storage.getUserWorkspaces(testUser.id);
    console.log(`✅ User belongs to ${workspaces.length} workspaces:`);
    workspaces.forEach(w => console.log(`   - [ID: ${w.id}] ${w.name}`));

    if (workspaces.length > 0) {
        console.log(`\n💡 SUGGESTION: Update diagnostic_check.ts to use Workspace ID: ${workspaces[0].id}`);
    }
  } catch (err: any) {
    console.error("❌ Search failed:", err.message);
  }
}

findWorkspace();
