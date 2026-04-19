import { adminClient } from "../server/services/supabase.js";

async function verifyProfiles() {
  console.log("🔍 Verifying 'profiles' table content...");
  try {
    const { data: profiles, error } = await adminClient.from("profiles").select("id, email, role, client_id");
    
    if (error) {
      console.error("❌ 'profiles' table lookup failed:", error.message);
      return;
    }

    console.log(`✅ Total Profiles: ${profiles.length}`);
    profiles.forEach(p => console.log(`   - [${p.id}] ${p.email || "No Email"} (${p.role})`));

    // Try finding testuser (might be email vs username)
    const testUser = profiles.find(p => (p as any).username === 'testuser' || p.email?.includes('testuser'));
    if (testUser) {
        console.log(`✅ Found 'testuser' in profiles.`);
    } else {
        console.warn("⚠️ 'testuser' not found. I may need to create one to proceed with certification.");
    }
    
  } catch (err: any) {
    console.error("❌ Verification failed:", err.message);
  }
}

verifyProfiles();
