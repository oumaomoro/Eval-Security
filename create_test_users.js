import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import { supabase } from './backend/services/supabase.service.js';

async function createTestAccounts() {
  console.log('🔄 Creating test accounts for user and admin levels...');

  const accounts = [
    { email: 'user@cyberoptimize.io', password: 'password123', role: 'user', tier: 'pro', name: 'Basic User' },
    { email: 'admin@cyberoptimize.io', password: 'password123', role: 'admin', tier: 'enterprise', name: 'Admin Enterprise' }
  ];

  for (const acc of accounts) {
    try {
      // Create user via admin API
      const { data: userAuth, error: authError } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: { role: acc.role, tier: acc.tier, full_name: acc.name }
      });

      if (authError) {
        if (authError.message.includes('already been registered')) {
          console.log(`✅ ${acc.email} already exists.`);
          
          // Try to update tier just in case
          const { data: user } = await supabase.auth.admin.getUserById(authError.message);
          // Update profile
          await supabase.from('profiles').update({ role: acc.role, tier: acc.tier }).eq('email', acc.email);
          continue;
        }
        console.error(`❌ Failed to create ${acc.email}:`, authError.message);
        continue;
      }

      console.log(`✅ Created ${acc.email} (UID: ${userAuth.user.id})`);

      // Ensure profile is updated correctly
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: acc.role, tier: acc.tier, full_name: acc.name })
        .eq('id', userAuth.user.id);

      if (profileError) {
        console.log(`⚠️ Warning: Profile update failed for ${acc.email} (might trigger on creation):`, profileError.message);
      } else {
         console.log(`✅ Profile updated for ${acc.email} -> Role: ${acc.role}, Tier: ${acc.tier}`);
      }

    } catch (err) {
      console.error(`❌ Error provisioning ${acc.email}:`, err.message);
    }
  }

  console.log('\n✅ Setup Complete! You can now log in.');
  console.log('--- TEST CREDENTIALS ---');
  console.log('1. STANDARD USER: user@cyberoptimize.io / password123 (Tier: pro)');
  console.log('2. ENTERPRISE ADMIN: admin@cyberoptimize.io / password123 (Tier: enterprise, Role: admin)');
  process.exit(0);
}

createTestAccounts();
