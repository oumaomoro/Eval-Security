import { type Express, type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { adminClient as supabase } from "../../services/supabase";
import { authStorage } from "./storage";

const PostgresStore = connectPg(session);

/**
 * UNIFIED AUTHENTICATION MIDDLEWARE V2
 * Supports both Session (Browser) and Bearer (Mobile/App/Tests) authentication.
 * Populates req.user with the unified profile and clientId context.
 */
export async function setupAuth(app: Express) {
  // Initialize Session Middleware
  const sessionSecret = process.env.SESSION_SECRET || "costloci-enterprise-default-secret";
  
  app.use(
    session({
      store: new PostgresStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
        tableName: "session",
      }),
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
    })
  );

  app.use(async (req: Request, res: Response, next: NextFunction) => {
    // 1. Resolve Identity (Session or Header)
    let token: string | undefined;

    // Check for Authorization Header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // Check for Session Token (Replit/Standard)
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
      // Always provide a base user object even if profile is missing, 
      // but if profile exists, it will have the clientId.
      (req as any).user = {
        id: user.id,
        email: user.email,
        firstName: localUser?.firstName ?? user.user_metadata?.first_name ?? "",
        lastName: localUser?.lastName ?? user.user_metadata?.last_name ?? "",
        clientId: localUser?.clientId ?? null,
        role: localUser?.role ?? "viewer",
        subscriptionTier: localUser?.subscriptionTier ?? "starter",
        profileImageUrl: localUser?.profileImageUrl ?? null,
        expires_at: user.last_sign_in_at,
        ip: req.ip,
        userAgent: req.headers["user-agent"] || "unknown"
      };

      // Add Harmonization Header for Debugging (Phase 25)
      res.setHeader("X-P25-Status", "Harmonized-V2");

      return next();
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
