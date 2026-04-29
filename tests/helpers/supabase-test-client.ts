import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function cleanupDatabase() {
  const testEmailDomain = "@costloci.test";
  
  // 1. Fetch test users
  const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
  if (userError) throw userError;

  const testUsers = users.users.filter(u => u.email?.endsWith(testEmailDomain));

  // 2. Delete test users (and cascading data)
  for (const user of testUsers) {
    await supabaseAdmin.auth.admin.deleteUser(user.id);
  }

  // 3. Truncate tables that might not cascade fully or need explicit clearing
  // Use raw SQL if necessary, but here we'll use the API for common tables
  const tables = [
    'audit_logs', 'infrastructure_logs', 'intelligence_cache', 
    'remediation_tasks', 'risks', 'contracts', 'clients', 'workspaces'
  ];

  for (const table of tables) {
    // Note: We only delete if they aren't protected by RLS or if we use service role
    await supabaseAdmin.from(table).delete().neq('id', -1); 
  }
}
