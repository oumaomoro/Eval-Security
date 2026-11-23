import { type Express, type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
// CRITICAL FIX: Use anon 'supabase' client (NOT adminClient) for auth.getUser().
// adminClient uses the service_role key as its own identity and cannot validate user JWTs.
import { supabase, adminClient, createUserClient } from "../../services/supabase.js";
import { authStorage } from "./storage.js";
import { storageContext } from "../../services/storageContext.js";
import { storage } from "../../storage.js";
import { pool } from "../../db.js";

const PostgresStore = connectPg(session);

/**
 * UNIFIED HYBRID AUTHENTICATION MIDDLEWARE V4
 * 
 * Resolves identity via Bearer JWT (Stateless) but maintains 
 * Stateful sessions for high-security MFA/WebAuthn flows.
 */
export async function setupAuth(app: Express) {
 // 1. Initialize Persistent Session Store (Phase 32 Auth Repair)
 // Required for WebAuthn/Passkey challenges which cannot be stateless.
 let sessionStore;
 if (pool) {
 sessionStore = new PostgresStore({
 pool: pool,
 tableName: "sessions",
 createTableIfMissing: true
 });
 } else {
 console.warn("[WARNING] [AUTH] Database pool unavailable. Falling back to MemoryStore (Sessions will not persist across restarts).");
 sessionStore = new session.MemoryStore();
 }

 const isProd = process.env.NODE_ENV === "production";
 app.use(session({
 store: sessionStore,
 secret: process.env.SESSION_SECRET || "costloci-sovereign-secret-2026",
 resave: false,
 saveUninitialized: false,
 cookie: {
 // CRITICAL: SameSite=none required for cross-domain cookie delivery.
 // Frontend (costloci.com) and backend (api.costloci.com) are different domains.
 secure: isProd, // Must be true when sameSite=none
 httpOnly: true,
 maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
 sameSite: isProd ? "none" : "lax"
 }
 }));

 app.use(async (req: Request, res: Response, next: NextFunction) => {
 if (process.env.NODE_ENV === 'test') {
 console.log(`[AUTH-DEBUG] ${req.method} ${req.url} - Test Header: ${req.headers["x-test-user-id"]}`);
 }
 // ── TEST-MODE BYPASS ────────────────────────────────────────────────────
 // When NODE_ENV=test and x-test-user-id header is present, inject a
 // pre-resolved identity using a direct Postgres query (bypasses Supabase
 // HTTP which can fail with DNS errors under parallel Jest worker load).
 // This bypass is NEVER active in production or development.
 if (process.env.NODE_ENV === "test" && req.headers["x-test-user-id"]) {
 const testUserId = req.headers["x-test-user-id"] as string;
 const testWorkspaceId = req.headers["x-workspace-id"] ? parseInt(req.headers["x-workspace-id"] as string) : undefined;
 
 console.log(`[AUTH-TEST] Bypass attempt for ${testUserId}. Workspace Header: ${testWorkspaceId}`);

 // ──────────────────────────────────────────────────────────────────────
 // SHALLOW BYPASS (DNS-RESILIENT)
 // If we have both, we avoid DB query entirely to bypass EAI_AGAIN issues.
 // ──────────────────────────────────────────────────────────────────────
 if (testUserId && testWorkspaceId) {
 (req as any).user = {
 id: testUserId,
 email: "test@costloci.test",
 firstName: "Test",
 lastName: "User",
 role: "admin",
 workspaceId: testWorkspaceId
 };
 console.log(`[AUTH-TEST] Shallow bypass success. Workspace: ${testWorkspaceId}`);
 return storageContext.run({ client: supabase, workspaceId: testWorkspaceId }, () => next());
 }

 // ──────────────────────────────────────────────────────────────────────
 // DEEP BYPASS (DB-DEPENDENT)
 // Fallback if workspace header is missing.
 // ──────────────────────────────────────────────────────────────────────
 try {
 let localUser: any = null;
 if (pool) {
 const result = await pool.query(
 `SELECT id, email, first_name, last_name, role, client_id, subscription_tier, contracts_count
 FROM profiles WHERE id = $1 LIMIT 1`,
 [testUserId]
 );
 localUser = result.rows[0] ?? null;
 }
 if (localUser) {
 (req as any).user = {
 id: testUserId,
 email: localUser.email,
 firstName: localUser.first_name ?? "Test",
 lastName: localUser.last_name ?? "User",
 role: localUser.role ?? "admin",
 clientId: localUser.client_id ?? null,
 subscriptionTier: localUser.subscription_tier ?? "starter",
 contractsCount: localUser.contracts_count ?? 0,
 profileImageUrl: null,
 ip: req.ip,
 userAgent: "test-agent"
 };
 // Resolve workspace via direct pool query too
 let workspaceId = testWorkspaceId;
 if (!workspaceId && pool) {
 const wsResult = await pool.query(
 `SELECT workspace_id FROM workspace_members WHERE user_id = $1 LIMIT 1`,
 [testUserId]
 );
 workspaceId = wsResult.rows[0]?.workspace_id;
 }
 console.log(`[AUTH-TEST] Deep bypass success. Workspace: ${workspaceId}`);
 return storageContext.run({ client: supabase, workspaceId }, () => next());
 } else {
 console.warn(`[AUTH-TEST] Bypass failed: user ${testUserId} not found in profiles table.`);
 }
 } catch (err: any) {
 console.warn(`[AUTH-TEST] Test bypass lookup failed for ${testUserId}: ${err.message}`);
 }
 }
 // ── END TEST-MODE BYPASS ────────────────────────────────────────────────

 // 1. Resolve Identity (Cookie, Session, or Header)
 let token: string | undefined;

 // Check for Secure Cookie (Phase 27 Hardening)
 if (req.cookies && req.cookies.costloci_session) {
 token = req.cookies.costloci_session;
 }

 // Fallback: Check for Authorization Header (for mobile/API clients)
 if (!token) {
 const authHeader = req.headers.authorization;
 if (authHeader?.startsWith("Bearer ")) {
 token = authHeader.substring(7);
 }
 }

 // Fallback: Check for Session Token (Legacy/Replit/WebAuthn flow)
 if (!token && (req as any).session?.supabase_token) {
 token = (req as any).session.supabase_token;
 }

 if (!token) return next();

 try {
 // 2. Verify token with Supabase using the ANON client.
 // The anon client correctly treats the passed token as the user's JWT.
 // Using adminClient here was the root cause of auth failures in production.
 const { data, error } = await supabase.auth.getUser(token);
 if (error || !data.user) {
 if (error) console.warn(`[AUTH] Token validation failed: ${error.message}`);
 return next();
 }

 const user = data.user;

 // 3. Resolve Local Profile (non-fatal — healing happens in /api/auth/user)
 const localUser = await authStorage.getUser(user.id).catch((err) => {
 console.error(`[AUTH] Profile retrieval failed for ${user.id}:`, err.message);
 return null;
 });

 // 4. Attach Identity Context
 (req as any).user = {
 id: user.id,
 email: user.email,
 firstName: localUser?.firstName ?? user.user_metadata?.first_name ?? "",
 lastName: localUser?.lastName ?? user.user_metadata?.last_name ?? "",
 clientId: localUser?.clientId ?? null,
 role: localUser?.role ?? "admin",
 subscriptionTier: localUser?.subscriptionTier ?? "starter",
 contractsCount: localUser?.contractsCount ?? 0,
 profileImageUrl: localUser?.profileImageUrl ?? null,
 paypalSubscriptionId: (localUser as any)?.paypalSubscriptionId ?? null,
 lastSyncAt: (localUser as any)?.lastSyncAt ?? null,
 expires_at: user.last_sign_in_at,
 ip: req.ip,
 userAgent: req.headers["user-agent"] || "unknown"
 };

 res.setHeader("X-P25-Status", "Harmonized-V3-Stateless-Hybrid");

 // 5. Resolve Active Workspace Context — wrapped so it never blocks the request
 let workspaceId: number | undefined;
 try {
 const defaultWorkspace = await Promise.race([
 storage.getDefaultWorkspace(user.id),
 new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
 ]);
 workspaceId = (defaultWorkspace as any)?.id;
 } catch (wsErr: any) {
 console.warn(`[AUTH] Workspace resolution failed for ${user.id}: ${wsErr.message}`);
 }

 (req as any).user.workspaceId = workspaceId;

 const userClient = createUserClient(token);
 return storageContext.run({ client: userClient, workspaceId }, () => next());
 } catch (err: any) {
 console.error("[AUTH] Identification failed:", err.message);
 return next();
 }
 });
}

/**
 * Session Accessor
 */
export function getSession(req: Request) {
 return (req as any).user || null;
}

/**
 * Simplified Authentication Guard
 */
export function isAuthenticated(req: any, res: Response, next: NextFunction) {
 if (req.user) {
 return next();
 }
 res.status(401).json({ message: "Unauthorized" });
}
