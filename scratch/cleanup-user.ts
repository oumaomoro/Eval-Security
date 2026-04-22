import "dotenv/config";
import { adminClient } from "../server/services/supabase";
import { storage } from "../server/storage";
import { users } from "../shared/models/auth";
import { eq } from "drizzle-orm";
import { db } from "../server/db";

async function cleanupUser() {
  const email = "file75555@gmail.com";
  console.log(`Cleaning up test user: ${email}...`);

  try {
    // 1. Get user from Supabase Auth
    const { data: { users: authUsers }, error: listError } = await adminClient.auth.admin.listUsers();
    if (listError) throw listError;

    const authUser = authUsers.find(u => u.email === email);
    if (authUser) {
      console.log(`Found auth user ${authUser.id}. Deleting...`);
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(authUser.id);
      if (deleteError) throw deleteError;
      console.log("Auth user deleted.");
    } else {
      console.log("No auth user found.");
    }

    // 2. Cleanup from Application Database (profiles/users)
    // The shared/models/auth 'users' table holds the profiles.
    // Note: Replit integration might store profiles.
    // We'll search for the user in the database 'users' table.
    const dbUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (dbUser.length > 0) {
      console.log(`Found DB profile for ${email}. Deleting...`);
      await db.delete(users).where(eq(users.id, dbUser[0].id));
      console.log("DB profile deleted.");
    } else {
      console.log("No DB profile found.");
    }

    console.log("✅ Cleanup complete.");
  } catch (err: any) {
    console.error("❌ Cleanup failed:", err.message);
  }
}

cleanupUser();
