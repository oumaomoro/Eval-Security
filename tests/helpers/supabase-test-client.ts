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
  // Match BOTH historical and current test email domains
  const testEmailDomains = ["@cyberoptimize.test", "@costloci.test"];
  
  // 1. Fetch test users
  const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
  if (userError) throw userError;

  const testUsers = users.users.filter(u =>
    testEmailDomains.some(domain => u.email?.endsWith(domain))
  );
  console.log(`[CLEANUP] Found ${users.users.length} total users, ${testUsers.length} test users to delete.`);

  // 2. Delete test users (and cascading data)
  for (const user of testUsers) {
    console.log(`[CLEANUP] Deleting user: ${user.email} (${user.id})`);
    await supabaseAdmin.auth.admin.deleteUser(user.id);
  }

  // 3. Truncate tables that might not cascade fully or need explicit clearing
  const tables = [
    'audit_logs', 'playbook_rules', 'playbooks', 'workspace_members',
    'infrastructure_logs', 'intelligence_cache', 'remediation_tasks',
    'risks', 'contracts', 'clients', 'workspaces', 'profiles'
  ];

  for (const table of tables) {
    const { error } = await supabaseAdmin.from(table).delete().not('id', 'is', null);
    if (error) console.warn(`[CLEANUP] Warning: could not truncate ${table}:`, error.message);
  }
}

