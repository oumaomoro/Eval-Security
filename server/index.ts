import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { doubleCsrf } from "csrf-csrf";
import { registerRoutes, seedDatabase } from "./routes.js";
import { AutonomicEngine } from "./services/AutonomicEngine.js";
import { serveStatic } from "./static.js";

const app = express();
app.set("trust proxy", 1); // Enable trusting the proxy (Vercel/Cloudflare) for accurate rate limiting

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "*.supabase.co", "*.google.com"],
      "connect-src": ["'self'", "*.supabase.co", "*.google.com", "http://localhost:*", "ws://localhost:*"],
      "img-src": ["'self'", "data:", "*.supabase.co", "https://*.replit.dev"],
      "frame-ancestors": ["'self'", "https://*.replit.dev", "https://*.replit.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS Configuration Refactored for Enterprise Environments
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [
      "https://costloci.com",
      "https://www.costloci.com",
      "http://localhost:3200",
      "http://127.0.0.1:3200",
      "http://localhost:5173"
    ];

app.use(cors({
  origin: (origin, callback) => {
    // Phase 27 Development Bypass
    if (process.env.NODE_ENV === "development" || !origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS-REJECTION: Origin ${origin} not allowed for Enterprise Infrastructure`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["content-type", "authorization", "x-requested-with", "x-p25-status", "Authorization", "Content-Type", "x-csrf-token", "x-workspace-id"]
}));

// CSRF Protection Configuration (Phase 32 Hardening)
const {
  invalidCsrfTokenError,
  generateCsrfToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || "c68a9728ad4aec98344137bfbfde96d8f23ab12057764dde01c1835933efb9e5",
  cookieName: "costloci_csrf",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getSessionIdentifier: (req: any) => req.sessionID || "sovereign-fallback",
  getCsrfTokenFromRequest: (req: any) => req.headers["x-csrf-token"],
});

// CSRF Token Endpoint
app.get("/api/csrf-token", (req: any, res: any) => {
  res.json({ token: generateCsrfToken(req, res) });
});

// Apply CSRF Protection to all non-ignored methods on API routes
app.use("/api", (req: any, res: any, next: any) => {
  // Bypass CSRF for:
  // 1. Bearer Token requests (Stateless APIs)
  // 2. Initial Auth routes (Register/Login) to support API-only certification
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const isAuthRoute = req.path === "/auth/register" || req.path === "/auth/login";
  const isWebhookRoute = req.path === "/integrations/signnow/webhook" || 
                         req.path === "/billing/paypal-webhook" ||
                         req.path === "/billing/paystack-webhook" ||
                         req.path === "/billing/stripe-webhook";
  
  if ((typeof authHeader === 'string' && authHeader.startsWith("Bearer ")) || isAuthRoute || isWebhookRoute) {
    return next();
  }
  return doubleCsrfProtection(req, res, next);
});

// ── PHASE 27: PREFLIGHT OPTIMIZATION ─────────
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'content-type, authorization, x-requested-with, x-p25-status, Authorization, Content-Type, x-csrf-token');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(200);
  }
  next();
});

// Logging Hook
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let resBody: any;

  const originalResJson = res.json;
  res.json = function (body) {
    resBody = body;
    return originalResJson.apply(res, arguments as any);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (resBody) {
        logLine += ` :: ${JSON.stringify(resBody)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      const timestamp = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
      console.log(`${timestamp} [express] ${logLine}`);
    }
  });

  next();
});

const httpServer = createServer(app);

(async () => {
  try {
    console.log("[BOOTSTRAP] Registering routes...");
    await registerRoutes(httpServer, app);
    console.log("[BOOTSTRAP] Routes registered.");

    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Internal Server Error:", err);
      if (res.headersSent) return next(err);
      return res.status(status).json({ message });
    });

    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      console.log("[BOOTSTRAP] Starting Vite...");
      const { setupVite } = await import("./vite.js");
      await setupVite(httpServer, app);
      console.log("[BOOTSTRAP] Vite ready.");
    }

    if (!process.env.VERCEL) {
      const port = parseInt(process.env.PORT || "3200", 10);
      httpServer.listen(port, "0.0.0.0", () => {
        console.log(`[SERVER] serving on port ${port}`);
        setTimeout(() => {
          console.log("[BOOTSTRAP] Starting background tasks...");
          seedDatabase().catch((e: any) => console.error("Seed failed:", e));
          AutonomicEngine.start();
        }, 1000);
      });
    } else {
      console.log("[Vercel] Bootstrapping Vercel Serverless Execution...");
      setTimeout(() => {
        seedDatabase().catch((e: any) => console.error("Seed failed:", e));
        AutonomicEngine.start();
      }, 500);
    }
  } catch (err: any) {
    console.error("CRITICAL STARTUP ERROR:", err);
    process.exit(1);
  }
})();

export default app;
