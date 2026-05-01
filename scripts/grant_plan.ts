/**
 * Costloci Plan Granting Utility
 * Manually sets the subscription tier for a user.
 * Usage: npx tsx scripts/grant_plan.ts <email> <tier>
 */
import { storage } from "../server/storage.js";
import { adminClient } from "../server/services/supabase.js";
import { readFileSync } from "fs";
import { resolve } from "path";

async function run() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error("❌ Usage: npx tsx scripts/grant_plan.ts <email> <starter|pro|enterprise>");
        process.exit(1);
    }

    const [email, tier] = args;
    const validTiers = ["starter", "pro", "enterprise"];
    if (!validTiers.includes(tier)) {
        console.error(`❌ Invalid tier: ${tier}. Valid: ${validTiers.join(", ")}`);
        process.exit(1);
    }

    // Load .env
    try {
        const envFile = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
        for (const line of envFile.split(/\r?\n/)) {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
            if (match) {
                let val = (match[2] || "").trim();
                if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                process.env[match[1]] = val;
            }
        }
    } catch { /* ok */ }

    try {
        console.log(`\n▶ Locating user: ${email}...`);
        const { data: users, error: listError } = await adminClient.auth.admin.listUsers();
        if (listError) throw listError;

        const user = users.users.find(u => u.email === email);
        if (!user) throw new Error(`User not found.`);

        console.log(`▶ Granting [${tier.toUpperCase()}] tier to ${email} (ID: ${user.id})...`);
        
        // Update local profile
        await storage.updateUser(user.id, { subscriptionTier: tier });

        console.log(`\n✅ SUCCESS: User ${email} is now on the ${tier.toUpperCase()} plan.`);
    } catch (err: any) {
        console.error(`\n❌ FAILED: ${err.message}`);
        process.exit(1);
    }
}

run();
