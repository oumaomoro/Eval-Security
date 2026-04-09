import dotenv from 'dotenv';
dotenv.config();

import { setupRescannerWorker } from '../services/queue.service.js';
// Disable long-running worker on Vercel Serverless to prevent function crash
if (!process.env.VERCEL) {
  setupRescannerWorker();
}
import express from 'express';
import crypto from 'crypto';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as Sentry from '@sentry/node';
import dns from 'dns/promises';
import { supabase } from '../services/supabase.service.js';
import { StartupService } from '../services/startup.service.js';

// ── PRE-FLIGHT AUTOFIX ──
// Skip intensive checks on Vercel to prevent startup timeouts (500 errors)
if (!process.env.VERCEL) {
  StartupService.runPreFlightChecks().catch(err => console.error('[Startup] Uncaught error during checks:', err));
} else {
  console.log('[Startup] Running on Vercel — skipping intensive pre-flight checks to ensure 200 OK.');
}

// ── LAZY LOADING REGISTRY ──────────────────────────────────────────────────
// Modules are now just-in-time loaded to prevent Vercel cold-start timeouts.
const loadRoute = (routeName) => async (req, res, next) => {
  try {
    console.log(`[LazyLoad] Attempting to load: ../routes/${routeName}.js`);
    const { default: router } = await import(`../routes/${routeName}.js`);
    console.log(`[LazyLoad] Successfully loaded: ${routeName}`);
    router(req, res, next);
  } catch (err) {
    console.error(`[LazyLoad] Hard Crash loading ${routeName}:`, err.message);
    next(err);
  }
};

const app = express();
app.set('trust proxy', 1); // Phase 7: Enable accurate rate limiting on Vercel/Cloudflare
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://*.vercel.app", "https://*.pages.dev"],
      connectSrc: ["'self'", "https://*.supabase.co", "https://api.openai.com", "https://*.upstash.io", "https://*.vercel.app"],
      imgSrc: ["'self'", "data:", "https://*.supabase.co", "https://Costloci.vercel.app", "https://*.pages.dev"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      upgradeInsecureRequests: [],
    },
  },
}));

// Force HTTPS in Production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.get('host')}${req.url}`);
    }
    next();
  });
}

const allowedOrigins = [
  'https://costloci.com',
  'https://www.costloci.com',
  'https://api.costloci.com',
  'https://costloci-frontend.pages.dev',
  'https://Costloci-frontend.pages.dev',
  'https://Costloci.vercel.app',
  'http://localhost:5182',
  'http://localhost:5180',
  'http://localhost:5173',
  'http://localhost:3001',
  'http://localhost:5000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Unified Enterprise Origin Check (Strict Anchor Mapping)
    const isAllowedOrigin = allowedOrigins.includes(origin) || 
      origin.endsWith('.costloci.com') || 
      origin.endsWith('.pages.dev') || 
      origin.endsWith('.vercel.app');

    if (isAllowedOrigin || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.warn(`[CORS-REJECT] Production Origin Mismatch: ${origin}`);
      callback(new Error('CORS Not Allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['*'] // Phase 11: Wildcard headers to prevent preflight rejections
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

app.use('/api', limiter);
app.use(express.json({
  limit: '25mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Root API index (Handles /api and /api/)
app.get(['/api', '/api/'], (req, res) => {
  res.json({
    name: 'Costloci Enterprise API',
    version: '1.2.3.1',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Hardened Health Check (Access via /api/health)
app.get(['/api/health', '/health'], async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1);
    dbStatus = error ? 'degraded' : 'connected';
  } catch (err) {
    dbStatus = 'unreachable';
  }

  res.status((dbStatus === 'connected') ? 200 : 503).json({
    status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Final Production Error Handler (Prefix-Aware)
app.use((err, req, res, next) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.error(`[Fatal Error] (${requestId}):`, err.message);
  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Internal Server Error' : err.name || 'Application Error',
    message: statusCode === 500 ? 'A critical unexpected error occurred.' : err.message,
    request_id: requestId,
  });
});

// API Routes - OPTIMIZED FOR SERVERLESS (PREFIX-AWARE RESILIENCE)
app.use(['/api/auth', '/auth'], loadRoute('auth.routes'));
app.use(['/api/contracts', '/contracts'], loadRoute('contract.routes'));
app.use(['/api/dashboard', '/dashboard'], loadRoute('dashboard.routes'));
app.use(['/api/marketplace', '/marketplace'], loadRoute('marketplace.routes'));
app.use(['/api/notifications', '/notifications'], loadRoute('notifications.routes'));
app.use(['/api/admin', '/admin'], loadRoute('admin.routes'));
app.use(['/api/billing', '/billing'], loadRoute('billing.routes'));
app.use(['/api/ai', '/ai'], loadRoute('ai.routes'));
app.use(['/api/compliance', '/compliance'], loadRoute('compliance.routes'));
app.use(['/api/audit', '/audit'], loadRoute('audit.routes'));
app.use(['/api/upload', '/upload'], loadRoute('upload.routes'));
app.use(['/api/workspaces', '/workspaces'], loadRoute('workspace.routes'));
app.use(['/api/infrastructure', '/infrastructure'], loadRoute('infrastructure.routes'));

// Single-Entry Start Logic (Hardened for Serverless)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  setupRescannerWorker();
  app.listen(PORT, () => {
    console.log(`🚀 Costloci backend running on http://localhost:${PORT}`);
  });
}

export default app;
