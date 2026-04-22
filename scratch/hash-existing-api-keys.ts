/**
 * scratch/hash-existing-api-keys.ts
 * 
 * Enterprise Security Migration:
 * This script identifies any legacy plain-text API keys in the profiles table
 * and hashes them using bcryptjs to align with the Phase 32 security standards.
 */

import { storage } from "../server/storage";
import bcrypt from "bcryptjs";

async function migrateKeys() {
  console.log("[MIGRATION] Starting API key security audit...");
  
  try {
    const { adminClient } = await import("../server/services/supabase");
    
    // 1. Fetch all profiles
    const { data: profiles, error } = await adminClient
      .from("profiles")
      .select("id, api_key");
      
    if (error) throw error;
    if (!profiles) return console.log("[MIGRATION] No profiles found.");

    console.log(`[MIGRATION] Auditing ${profiles.length} profiles...`);
    
    let migratedCount = 0;
    let skippedCount = 0;

    for (const profile of profiles) {
      const rawKey = profile.api_key;
      
      if (!rawKey) {
        skippedCount++;
        continue;
      }

      // Check if already hashed (bcrypt hashes usually start with $2)
      if (rawKey.startsWith("$2a$") || rawKey.startsWith("$2b$") || rawKey.startsWith("$2y$")) {
        skippedCount++;
        continue;
      }

      console.log(`[MIGRATION] Hashing plain-text key for user ${profile.id}...`);
      
      const hashedKey = await bcrypt.hash(rawKey, 10);
      
      const { error: updateError } = await adminClient
        .from("profiles")
        .update({ api_key: hashedKey })
        .eq("id", profile.id);

      if (updateError) {
        console.error(`[MIGRATION] Failed to update user ${profile.id}:`, updateError.message);
      } else {
        migratedCount++;
      }
    }

    console.log("--------------------------------------------------");
    console.log(`[MIGRATION] Audit Complete.`);
    console.log(`[MIGRATION] Keys Migrated: ${migratedCount}`);
    console.log(`[MIGRATION] Keys Skipped (Already Hashed/Empty): ${skippedCount}`);
    console.log("--------------------------------------------------");

  } catch (err: any) {
    console.error("[MIGRATION CRITICAL ERROR]", err.message);
  }
}

migrateKeys();
