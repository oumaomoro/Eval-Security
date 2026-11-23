import request from "supertest";
import { expect, describe, it, beforeAll } from "@jest/globals";
import { cleanupDatabase } from "../helpers/supabase-test-client";
import { createTestUser, type TestUser } from "../helpers/test-auth";

const API_URL = "http://127.0.0.1:3200";

/**
 * SOVEREIGN ISOLATION SECURITY TEST
 * ═════════════════════════════════════
 * Validates that the hardened RBAC middleware and storage context 
 * successfully prevent cross-tenant data leakage (IDOR).
 */
describe("Workspace Isolation Hardening", () => {
 let userA: TestUser;
 let userB: TestUser;
 let playbookIdA: number;
 let ruleIdA: number;
 let riskIdA: number;

 beforeAll(async () => {
 // 1. Reset environment
 await cleanupDatabase();
 
 // 2. Setup two distinct tenants
 const runId = Date.now();
 userA = await createTestUser(`tenant-a-${runId}@cyberoptimize.test`, "SecurePass123!", "Alice", "Admin");
 userB = await createTestUser(`tenant-b-${runId}@cyberoptimize.test`, "SecurePass123!", "Bob", "Admin");
 
 // Allow time for Supabase triggers to provision workspace context
 await new Promise(r => setTimeout(r, 2000));

 // 3. Create resources for Tenant A
 // Create Playbook
 const playbookRes = await request(API_URL)
 .post("/api/playbooks")
 .set(userA.authHeaders())
 .send({ name: "Tenant A Compliance Playbook", category: "security" });
 playbookIdA = playbookRes.body.id;

 // Create Rule in Playbook A
 const ruleRes = await request(API_URL)
 .post(`/api/playbooks/${playbookIdA}/rules`)
 .set(userA.authHeaders())
 .send({ 
 name: "Restricted Data Flow", 
 condition: { field: "region", operator: "eq", value: "KE" },
 action: { type: "block" }
 });
 ruleIdA = ruleRes.body.id;

 // Create a mock contract then a risk
 const contractRes = await request(API_URL)
 .post("/api/contracts")
 .set(userA.authHeaders())
 .send({ vendorName: "A-Vendor", productService: "A-Service", category: "endpoint_protection" });
 
 const riskRes = await request(API_URL)
 .post("/api/risks")
 .set(userA.authHeaders())
 .send({ 
 contractId: contractRes.body.id,
 riskTitle: "Cross-Tenant Exposure Risk",
 riskCategory: "security",
 severity: "critical",
 likelihood: "rare",
 impact: "very_high"
 });
 riskIdA = riskRes.body.id;
 }, 180000);

 describe("Playbook Isolation", () => {
 it("should prevent User B from viewing User A's playbook", async () => {
 const res = await request(API_URL)
 .get(`/api/playbooks/${playbookIdA}`)
 .set(userB.authHeaders());
 
 expect([403, 404]).toContain(res.status);
 });

 it("should prevent User B from adding rules to User A's playbook", async () => {
 const res = await request(API_URL)
 .post(`/api/playbooks/${playbookIdA}/rules`)
 .set(userB.authHeaders())
 .send({ name: "Illegal Rule", condition: { field: "any", operator: "eq", value: "any" }, action: { type: "allow" } });
 
 expect([403, 401]).toContain(res.status);
 });
 });

 describe("Rules Engine Isolation", () => {
 it("should prevent User B from modifying User A's rule", async () => {
 const res = await request(API_URL)
 .patch(`/api/playbooks/${playbookIdA}/rules/${ruleIdA}`)
 .set(userB.authHeaders())
 .send({ name: "Hacked Rule" });
 
 expect([403, 404]).toContain(res.status);
 });

 it("should prevent User B from deleting User A's rule", async () => {
 const res = await request(API_URL)
 .delete(`/api/playbooks/${playbookIdA}/rules/${ruleIdA}`)
 .set(userB.authHeaders());
 
 expect([403, 404]).toContain(res.status);
 });
 });

 describe("Risk Mitigation Isolation", () => {
 it("should prevent User B from updating User A's risk mitigation status", async () => {
 const res = await request(API_URL)
 .patch(`/api/risks/${riskIdA}/mitigate`)
 .set(userB.authHeaders())
 .send({ status: "mitigated", strategy: "Unauthorized mitigation" });
 
 expect([403, 404]).toContain(res.status);
 });
 });

 describe("Audit Trail Verification", () => {
 it("should show that User A's actions were logged and User B's failures were NOT in User A's audit log", async () => {
 const res = await request(API_URL)
 .get("/api/audit-logs")
 .set(userA.authHeaders());
 
 expect(res.status).toBe(200);
 const logs = res.body;
 
 // Check for Playbook creation log
 const playbookLog = logs.find((l: any) => l.action === "PLAYBOOK_CREATED" && l.resourceId === String(playbookIdA));
 expect(playbookLog).toBeDefined();
 expect(playbookLog.workspaceId).toBeDefined();

 // Ensure no actions from User B leaked into User A's audit trail
 const userBLogs = logs.filter((l: any) => l.userId === userB.userId);
 expect(userBLogs.length).toBe(0);
 });
 });
});
