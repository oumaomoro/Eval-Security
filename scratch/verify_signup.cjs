const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase configuration");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser(email) {
  console.log(`Checking user: ${email}`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: 'costloci1@gmail.com',
  });

  if (error) {
    console.log(`Login failed for ${email}: ${error.message}`);
    if (error.message.includes("Invalid login credentials") || error.message.includes("does not exist")) {
        console.log("Proceeding to test registration...");
        return false;
    }
  } else {
    console.log(`User ${email} already exists and login works! User ID: ${data.user.id}`);
    return true;
  }
}

async function registerUser(email, password, firstName, lastName) {
    console.log(`Attempting registration for: ${email}`);
    try {
        const response = await fetch('http://127.0.0.1:3001/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, firstName, lastName })
        });
        const result = await response.json();
        console.log("Registration Response:", JSON.stringify(result, null, 2));
    } catch (err) {
        console.error("Registration Request Failed:", err.message);
    }
}

async function loginLocal(email, password) {
  console.log(`Testing local server login for: ${email}`);
  try {
    const response = await fetch('http://127.0.0.1:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();
    console.log("Local Login Response Status:", response.status);
    console.log("Local Login P25-Status:", response.headers.get("X-P25-Status"));
    console.log("Local Login Result:", JSON.stringify(result, null, 2));
    if (response.headers.get("X-Self-Healing")) {
        console.log("!!! SELF-HEALING TRIGGERED !!! - Status:", response.headers.get("X-Self-Healing"));
    }
    return response.ok;
  } catch (err) {
    console.error("Local Login Request Failed:", err.message);
    return false;
  }
}

async function breakUser(userId) {
  console.log(`Simulating broken identity for UV-ID: ${userId}`);
  const { error } = await supabase.from('profiles').update({
    client_id: null,
    organization_id: null
  }).eq('id', userId);
  
  if (error) console.error("Failed to break user:", error.message);
  else console.log("User linkage wiped. Ready for Self-Healing test.");
}

async function run() {
    const email = "costloci1@gmail.com";
    const password = "costloci1@gmail.com";
    
    console.log("--- STARTING PHASE 26 DEEP VERIFICATION ---");
    const { data: { user } } = await supabase.auth.signInWithPassword({ email, password });
    
    if (!user) {
        console.log("User not found, registering first...");
        await registerUser(email, password, "JOHN", "DOE");
    } else {
        await breakUser(user.id);
    }
    
    console.log("\n--- TRIGGERING SELF-HEALING LOGIN ---");
    await loginLocal(email, password);
    
    console.log("\n--- VERIFYING RECOVERED STATE ---");
    const { data: recovered } = await supabase.from('profiles').select('*').eq('email', email).single();
    if (recovered.client_id && recovered.organization_id) {
        console.log("SUCCESS: Self-Healing successfully restored Enterprise Linkage!");
        console.log(`Recovered CID: ${recovered.client_id}, OID: ${recovered.organization_id}`);
    } else {
        console.log("FAILURE: Self-Healing did not restore linkage.");
    }
}

run();
