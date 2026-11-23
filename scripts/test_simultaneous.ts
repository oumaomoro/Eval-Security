/**
 * Costloci Enterprise — Simultaneous Integration Test
 * ═════════════════════════════════════════════════
 * Validates concurrent ingestion of vendor contracts and insurance policies
 * using real-world files from the scratch directory.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import FormData from "form-data";
import fetch from "node-fetch";

// Load .env
try {
 const envFile = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
 for (const line of envFile.split(/\r?\n/)) {
 const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
 if (m && !process.env[m[1]]) {
 let val = (m[2] || "").trim().replace(/^"(.*)"$/, "$1");
 process.env[m[1]] = val;
 }
 }
} catch { /* ok */ }

// Config
const API = "http://127.0.0.1:3200";
const SB_URL = process.env.SUPABASE_URL!;
const SB_SVC = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SB_URL || !SB_SVC) {
 console.error(" SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
 process.exit(1);
}

const adminSB = createClient(SB_URL, SB_SVC);

async function run() {
 console.log("\n STARTING SIMULTANEOUS HIGH-FIDELITY TEST...");

 // 1. Setup Test User
 const email = `simul_${Math.random().toString(36).slice(2, 8)}@test.com`;
 const password = "E2ePass!99XZ";
 
 const { data: userRes, error: userErr } = await adminSB.auth.admin.createUser({
 email, password, email_confirm: true
 });
 if (userErr || !userRes.user) throw new Error("User creation failed: " + userErr?.message);
 const userId = userRes.user.id;
 console.log(` Test User Created: ${email}`);

 // 2. Get JWT
 const { data: authRes, error: authErr } = await adminSB.auth.signInWithPassword({ email, password });
 if (authErr || !authRes.session) throw new Error("Login failed");
 const token = authRes.session.access_token;

 // 3. Login to server (onboarding)
 await fetch(`${API}/api/auth/login`, {
 method: "POST",
 headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
 body: JSON.stringify({ email, password })
 });
 
 // Get Workspace ID
 const wsRes = await fetch(`${API}/api/workspaces`, { headers: { "Authorization": `Bearer ${token}` } });
 const workspaces = await wsRes.json();
 const workspaceId = workspaces[0].id;
 console.log(` Onboarded to Workspace: ${workspaceId}`);

 // 4. Parallel Uploads
 console.log("⏳ Uploading Vendor Contract and Insurance Policy SIMULTANEOUSLY...");

 const vendorForm = new FormData();
 vendorForm.append("files", readFileSync(resolve(process.cwd(), "scratch", "Seacom - Nairobi.pdf")), { filename: "Seacom - Nairobi.pdf" });

 const insuranceForm = new FormData();
 insuranceForm.append("file", readFileSync(resolve(process.cwd(), "scratch", "Axmed insurane policy.pdf")), { filename: "Axmed insurane policy.pdf" });

 const startTime = Date.now();
 
 const [vendorRes, insuranceRes] = await Promise.all([
 fetch(`${API}/api/contracts/bulk-upload`, {
 method: "POST",
 headers: { "Authorization": `Bearer ${token}`, "x-workspace-id": String(workspaceId), ...vendorForm.getHeaders() },
 body: vendorForm.getBuffer()
 }),
 fetch(`${API}/api/insurance/upload`, {
 method: "POST",
 headers: { "Authorization": `Bearer ${token}`, "x-workspace-id": String(workspaceId), ...insuranceForm.getHeaders() },
 body: insuranceForm.getBuffer()
 })
 ]);

 const duration = ((Date.now() - startTime) / 1000).toFixed(2);
 console.log(`⏱️ Concurrent Uploads Completed in ${duration}s`);

 // 5. Verify Results
 if (vendorRes.ok || vendorRes.status === 207) {
 const data = await vendorRes.json();
 console.log(` Vendor Contract Ingested: ${data.summary?.accepted || 0} accepted`);
 } else {
 console.error(` Vendor Upload Failed: ${vendorRes.status} ${await vendorRes.text()}`);
 }

 if (insuranceRes.status === 201) {
 const data = await insuranceRes.json();
 console.log(` Insurance Policy Ingested: ${data.carrierName} (ID: ${data.id})`);
 } else {
 console.error(` Insurance Upload Failed: ${insuranceRes.status} ${await insuranceRes.text()}`);
 }

 // 6. Cleanup
 await adminSB.auth.admin.deleteUser(userId);
 console.log(" Cleanup Complete.");
 
 console.log("\n TEST SUITE FINISHED ");
}

run().catch(err => {
 console.error("\n[ERROR] TEST FAILED:", err.message);
 process.exit(1);
});
