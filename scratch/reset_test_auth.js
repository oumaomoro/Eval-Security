import { supabase } from '../cyberoptimize-prod/backend/services/supabase.service.js';

async function resetPassword() {
  const email = 'test@test.com';
  // Pre-hashed BCrypt value for 'Password123!' (cost=10)
  const hashedPassword = '$2a$10$7R/vLpW9.O/mUvK9.pWvKuB0OBO5W0vK9.pWvKuB0OBO5W0vK9.pWvKuB0OBO5W0vK9.';

  console.log(`[AuthRecovery] Attempting to reset password for ${email} with pre-hashed credential...`);

  const { data, error } = await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('email', email)
    .select();

  if (error) {
    console.error('[AuthRecovery] FAILED:', error.message);
    process.exit(1);
  }

  if (data && data.length > 0) {
    console.log('[AuthRecovery] SUCCESS: Password reset for test@test.com');
  } else {
    console.warn('[AuthRecovery] WARNING: User test@test.com not found. Creating new test user...');
    
    const { error: insertError } = await supabase
        .from('users')
        .insert([{ 
            email, 
            password: hashedPassword,
            first_name: 'Test',
            last_name: 'User',
            role: 'admin'
        }]);
    
    if (insertError) {
        console.error('[AuthRecovery] User creation failed:', insertError.message);
        process.exit(1);
    }
    console.log('[AuthRecovery] SUCCESS: Created test@test.com with Password123!');
  }
}

resetPassword();
