import { supabase } from '../cyberoptimize-prod/backend/services/supabase.service.js';

async function checkIds() {
  console.log('[Forensic] Checking "organizations" table sample...');
  const { data: orgs, error: orgError } = await supabase.from('organizations').select('*').limit(1);
  if (orgs && orgs[0]) {
      console.log('Organization ID sample:', orgs[0].id, typeof orgs[0].id);
  } else {
      console.log('No organizations found or error:', orgError?.message);
  }

  console.log('[Forensic] Checking "workspaces" table sample...');
  const { data: workspaces, error: wsError } = await supabase.from('workspaces').select('*').limit(1);
  if (workspaces && workspaces[0]) {
      console.log('Workspace ID sample:', workspaces[0].id, typeof workspaces[0].id);
  } else {
      console.log('No workspaces found or error:', wsError?.message);
  }

  console.log('[Forensic] Checking if email file75555@gmail.com exists in profiles...');
  const { data: profiles } = await supabase.from('profiles').select('id, email').eq('email', 'file75555@gmail.com');
  console.log('Profile found:', profiles);
}

checkIds();
