import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

import { supabase } from '../backend/services/supabase.service.js';

async function verify() {
  const email = 'file75556@gmail.com';
  const password = 'password123';
  
  console.log('--- Provisioning Test User ---');
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'analyst', tier: 'free' }
  });

  if (error) {
    if (error.message.includes('already been registered')) {
        console.log('User already exists. Updating tier to free and role to analyst.');
        const { data: usersData } = await supabase.auth.admin.listUsers();
        const existingUser = usersData.users.find(u => u.email === email);
        if (existingUser) {
           await supabase.from('profiles').update({ tier: 'free', role: 'analyst' }).eq('id', existingUser.id);
           await supabase.auth.admin.updateUserById(existingUser.id, { user_metadata: { role: 'analyst', tier: 'free' } });
        }
    } else {
        console.error('Error creating user:', error.message);
        process.exit(1);
    }
  } else {
    console.log('User created:', data.user.id);
  }
  process.exit(0);
}

verify();
