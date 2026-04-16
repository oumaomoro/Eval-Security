import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * SOVEREIGN SUPABASE SERVICE - ISOLATED PRIVILEGE MODEL
 * We provide two distinct clients to prevent session leakage:
 * 1. 'supabase' (Standard): Used for user-facing auth (anon/user role).
 * 2. 'adminClient' (Sovereign): Used for storage operations (service_role).
 * 
 * This isolation ensures that even after a user logs in via the standard client, 
 * autonomic operations in 'storage.ts' still have full 'service_role' permissions 
 * and can bypass RLS for provisioning.
 */

const getEnvKey = (keyName: string): string => {
  if (process.env[keyName]) return process.env[keyName]!;
  
  const envPath = resolve(process.cwd(), ".env");
  if (existsSync(envPath)) {
    try {
      const envFile = readFileSync(envPath, "utf-8");
      for (const line of envFile.split(/\r?\n/)) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match && match[1] === keyName) {
          let val = match[2] || "";
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          return val.trim();
        }
      }
    } catch (e) {
      console.error(`Warning: Could not read .env for ${keyName}`);
    }
  }
  return "";
};

const url = getEnvKey("SUPABASE_URL") || "https://ulercnwyckrcjcnrenzz.supabase.co";
const serviceKey = getEnvKey("SUPABASE_SERVICE_ROLE_KEY");
const anonKey = getEnvKey("SUPABASE_ANON_KEY") || serviceKey; // Fallback if anon is not set

// STANDARD CLIENT (User Auth)
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

// ADMIN CLIENT (Sovereign Operations)
export const adminClient = createClient(url, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

if (!serviceKey) {
  console.warn("⚠️  SUPABASE_SERVICE_ROLE_KEY is missing. Autonomic provisioning will fail.");
} else {
  console.log(`[DIAGNOSTIC] Isolated Admin Client initialized. RLS bypass enabled.`);
  console.log(`[DIAGNOSTIC] Target URL: ${url}`);
}

export const getSupabase = () => supabase;
export const getAdminClient = () => adminClient;
export const createUserClient = (jwtToken: string) => {
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    },
  });
};
