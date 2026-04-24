import { adminClient } from '../server/services/supabase.js';

async function confirmUser(email: string) {
  console.log(`Searching for user with email: ${email}`);
  
  const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
  if (listError) throw listError;
  
  const user = users.find(u => u.email === email);
  if (!user) {
    console.error(`User ${email} not found.`);
    process.exit(1);
  }
  
  console.log(`Found user ${user.id}. Confirming email...`);
  
  const { data, error } = await adminClient.auth.admin.updateUserById(
    user.id,
    { email_confirm: true }
  );
  
  if (error) throw error;
  
  console.log(`✅ User ${email} confirmed successfully.`);
  process.exit(0);
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx confirm_user.ts <email>");
  process.exit(1);
}

confirmUser(email);
