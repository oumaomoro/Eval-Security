import { adminClient } from "../server/services/supabase.js";
import dotenv from "dotenv";
dotenv.config();

async function confirmUser(email: string) {
  console.log(`--- 🧪 MANUALLY CONFIRMING USER: ${email} ---`);
  
  try {
    // 1. Get user by email to get ID
    const { data: users, error: listError } = await adminClient.auth.admin.listUsers();
    if (listError) throw listError;
    
    const user = users.users.find(u => u.email === email);
    if (!user) throw new Error(`User with email ${email} not found.`);
    
    // 2. Update user to confirm email
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );
    
    if (updateError) throw updateError;
    
    console.log(`✅ [SUCCESS] User ${email} (ID: ${user.id}) has been confirmed.`);
  } catch (error: any) {
    console.error(`❌ [FAIL] Confirmation Failed: ${error.message}`);
    process.exit(1);
  }
}

confirmUser("0moroouma1@gmail.com");
