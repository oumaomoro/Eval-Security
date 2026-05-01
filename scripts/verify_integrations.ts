/**
 * Costloci Live Integration Verifier
 * Tests DeepSeek, OpenAI, PayPal, and Paystack connectivity.
 * Usage: npx tsx scripts/verify_integrations.ts
 */
import { IntelligenceGateway } from "../server/services/IntelligenceGateway.js";
import { PaystackService } from "../server/services/PaystackService.js";
import { readFileSync } from "fs";
import { resolve } from "path";
import fetch from "node-fetch";

async function verifyAI(provider: 'deepseek' | 'openai') {
    console.log(`\n▶ Testing ${provider.toUpperCase()}...`);
    try {
        const result = await (IntelligenceGateway as any).createCompletion({
            model: provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o',
            messages: [{ role: "user", content: "Hello, this is a connectivity test. Respond with 'OK'." }],
            max_tokens: 5
        });
        console.log(`  ✅ ${provider.toUpperCase()} responded: ${result.trim()}`);
    } catch (err: any) {
        console.error(`  ❌ ${provider.toUpperCase()} FAILED:`, err.message);
    }
}

async function verifyPayPal() {
    console.log("\n▶ Testing PAYPAL...");
    const client_id = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;
    const base = "https://api-m.paypal.com";

    if (!client_id || !secret) {
        console.error("  ❌ PayPal credentials missing in .env");
        return;
    }

    try {
        const auth = Buffer.from(`${client_id}:${secret}`).toString("base64");
        const res = await fetch(`${base}/v1/oauth2/token`, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "grant_type=client_credentials"
        });

        if (res.ok) {
            const data: any = await res.json();
            console.log(`  ✅ PayPal Authenticated (Access Token obtained, expires in ${data.expires_in}s)`);
        } else {
            const err = await res.text();
            console.error(`  ❌ PayPal Auth FAILED: ${res.status} - ${err}`);
        }
    } catch (err: any) {
        console.error("  ❌ PayPal Request FAILED:", err.message);
    }
}

async function verifyPaystack() {
    console.log("\n▶ Testing PAYSTACK...");
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
        console.error("  ❌ Paystack secret missing in .env");
        return;
    }

    try {
        const res = await fetch("https://api.paystack.co/balance", {
            headers: { "Authorization": `Bearer ${secret}` }
        });

        if (res.ok) {
            const data: any = await res.json();
            console.log(`  ✅ Paystack Authenticated (Status: ${data.message})`);
        } else {
            const err = await res.text();
            console.error(`  ❌ Paystack Auth FAILED: ${res.status} - ${err}`);
        }
    } catch (err: any) {
        console.error("  ❌ Paystack Request FAILED:", err.message);
    }
}

async function run() {
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

    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║   COSTLOCI INTEGRATION VERIFICATION                      ║");
    console.log("╚══════════════════════════════════════════════════════════╝");

    await verifyAI('openai');
    await verifyAI('deepseek');
    await verifyPayPal();
    await verifyPaystack();
}

run().catch(err => {
    console.error("💥 Fatal Error:", err);
    process.exit(1);
});
