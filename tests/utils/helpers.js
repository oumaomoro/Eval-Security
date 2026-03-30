import { expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'fake-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function loginToUI(page, email = 'test@example.com', password = 'password123') {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function setupTestUser(role = 'user', tier = 'free') {
  const email = `test_${Date.now()}@example.com`;
  
  // Using Mock Admin capabilities since we're in test env
  // Usually would create user securely
  try {
     const { data: user, error } = await supabase.auth.admin.createUser({
       email,
       password: 'password123',
       email_confirm: true,
       user_metadata: { role, tier }
     });
     
     if (user) {
        await supabase.from('profiles').update({ role, tier }).eq('id', user.user.id);
        return { email, password: 'password123', id: user.user.id };
     }
  } catch(e) {
     // Fallback to hardcoded mock for simplified local testing
     return { email: 'test@example.com', password: 'password123', id: '00000000-0000-0000-0000-000000000000' };
  }
}

export async function teardownTestUser(userId) {
  try {
     await supabase.auth.admin.deleteUser(userId);
  } catch(e) {}
}
