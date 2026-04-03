import { type Express, type RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";
import { supabase } from "../../services/supabase";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "cyber-optimize-dev-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Middleware to attach Supabase user to request
  app.use(async (req: any, _res: any, next: any) => {
    const supabaseToken = req.session?.supabase_token;
    if (supabaseToken) {
      const { data: { user }, error } = await supabase.auth.getUser(supabaseToken);
      if (!error && user) {
        const localUser = await authStorage.getUser(user.id);
        req.user = {
          id: user.id,
          email: user.email,
          firstName: localUser?.firstName || user.user_metadata?.first_name,
          lastName: localUser?.lastName || user.user_metadata?.last_name,
          clientId: localUser?.clientId,
          role: localUser?.role,
          profileImageUrl: user.user_metadata?.avatar_url,
          expires_at: req.session.expires_at
        };
      }
    }
    next();
  });
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  if (!req.session?.supabase_token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { data: { user }, error } = await supabase.auth.getUser(req.session.supabase_token);
  if (error || !user) {
    req.session.destroy(() => {});
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
};

