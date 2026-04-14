import { supabase } from '../cyberoptimize-prod/backend/services/supabase.service.js';

async function cleanup() {
  const emails = ['recovery_test_1@costloci.com', 'recovery_test_2@costloci.com'];
  
  for (const email of emails) {
    console.log(`[Cleanup] Attempting to purge user: ${email}`);
    
    // 1. Get User ID
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
    if (fetchError) {
        console.error('[Cleanup] Failed to list users:', fetchError.message);
        break;
    }
    
    const targetUser = users.users.find(u => u.email === email);
    
    if (targetUser) {
        const userId = targetUser.id;
        
        // 2. Delete Profile
        console.log(`[Cleanup] Deleting profile for ${userId}...`);
        await supabase.from('profiles').delete().eq('id', userId);
        
        // 3. Delete Auth User
        console.log(`[Cleanup] Deleting Auth entry for ${userId}...`);
        const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
        
        if (deleteError) {
            console.error(`[Cleanup] Failed to delete ${email}:`, deleteError.message);
        } else {
            console.log(`[Cleanup] SUCCESS: Purged ${email}`);
        }
    } else {
        console.log(`[Cleanup] User ${email} not found in Auth repository.`);
    }
  }
}

cleanup();
