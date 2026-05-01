/**
 * Costloci Raw Integration Tester (Completion Test)
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import fetch from "node-fetch";

async function run() {
    const env: any = {};
    try {
        const envFile = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
        for (const line of envFile.split(/\r?\n/)) {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
            if (match) {
                let val = (match[2] || "").trim();
                if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                env[match[1]] = val;
            }
        }
    } catch { /* ok */ }

    console.log("▶ Raw DeepSeek Completion...");
    try {
        const dsRes = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${env['DEEPSEEK_API_KEY']}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{ role: "user", content: "Hi" }],
                max_tokens: 5
            })
        });
        const dsData: any = await dsRes.json();
        console.log(`  DeepSeek: ${dsRes.status} - ${dsData.error?.message || "OK"}`);
    } catch (e: any) {
        console.error(`  DeepSeek Network Error: ${e.message}`);
    }

    console.log("\n▶ Raw OpenAI Completion (gpt-4o-mini)...");
    try {
        const oaRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${env['OPENAI_API_KEY']}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: "Hi" }],
                max_tokens: 5
            })
        });
        const oaData: any = await oaRes.json();
        
        console.log(`  Status: ${oaRes.status}`);
        console.log(`  Error: ${oaData.error?.message || "None"}`);
        console.log(`  Headers:`);
        console.log(`    x-ratelimit-limit-requests: ${oaRes.headers.get('x-ratelimit-limit-requests')}`);
        console.log(`    x-ratelimit-remaining-requests: ${oaRes.headers.get('x-ratelimit-remaining-requests')}`);
        console.log(`    x-ratelimit-limit-tokens: ${oaRes.headers.get('x-ratelimit-limit-tokens')}`);
        console.log(`    x-ratelimit-remaining-tokens: ${oaRes.headers.get('x-ratelimit-remaining-tokens')}`);
        
        if (oaRes.status === 429) {
            console.log("\n  [ANALYSIS] 429 Error Analysis:");
            console.log("  - If 'remaining' is 0: You have hit a temporary rate limit.");
            console.log("  - If 'remaining' is NOT 0: You likely have $0.00 balance in your account.");
            console.log("  - Note: OpenAI accounts created more than 3 months ago often have expired free credits.");
        }
    } catch (e: any) {
        console.error(`  OpenAI Network Error: ${e.message}`);
    }
}

run();
