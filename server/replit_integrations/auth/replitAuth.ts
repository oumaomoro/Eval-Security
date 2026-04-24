import { type Express, type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { adminClient as supabase, createUserClient } from "../../services/supabase.js";
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
    console.warn("⚠️  [AUTH] Database pool unavailable. Falling back to MemoryStore (Sessions will not persist across restarts).");
    sessionStore = new session.MemoryStore();
  }

  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "costloci-sovereign-secret-2026",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: "lax"
    }
  }));

  app.use(async (req: Request, res: Response, next: NextFunction) => {
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
      // 2. Refresh/Verify with Supabase
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) return next();

      const user = data.user;

      // 3. Resolve Local Profile
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
        role: localUser?.role ?? "viewer",
        subscriptionTier: localUser?.subscriptionTier ?? "starter",
        contractsCount: localUser?.contractsCount ?? 0,
        profileImageUrl: localUser?.profileImageUrl ?? null,
        expires_at: user.last_sign_in_at,
        ip: req.ip,
        userAgent: req.headers["user-agent"] || "unknown"
      };

      res.setHeader("X-P25-Status", "Harmonized-V3-Stateless-Hybrid");

      // 5. Resolve Active Workspace Context (Sovereign Mode)
      const defaultWorkspace = await storage.getDefaultWorkspace(user.id).catch(() => null);
      const workspaceId = defaultWorkspace?.id;

      const userClient = createUserClient(token);
      
      if (workspaceId) {
          // storageContext.run handles the workspace isolation in the application layer.
      }

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
