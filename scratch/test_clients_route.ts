import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const envFile = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
for (const line of envFile.split(/\r?\n/)) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
  if (match) {
    let val = (match[2] || "").trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    process.env[match[1]] = val;
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testRole() {
  const email = `diag_${Date.now()}@costloci.test`;
  const password = "Password123!";
  
  const { data: createData, error: createErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: "Diag", last_name: "Role" },
  });

  const userId = createData.user!.id;
  
  const anonClient = createClient(SUPABASE_URL, process.env.SUPABASE_ANON_KEY!);
  const { data: signInData } = await anonClient.auth.signInWithPassword({ email, password });
  const token = signInData.session!.access_token;
  
  console.log("Triggering onboarding...");
  const onboardRes = await fetch("http://127.0.0.1:3500/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ email, password })
  });
  console.log("Onboard Auth:", await onboardRes.json());
  
  console.log("Fetching User Data...");
  const userRes = await fetch("http://127.0.0.1:3500/api/auth/user", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("User Data:", await userRes.json());
  
  console.log("Fetching Clients...");
  const clientsRes = await fetch("http://127.0.0.1:3500/api/clients", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("Clients status:", clientsRes.status);
  console.log("Clients Data:", await clientsRes.json());
}

testRole();
