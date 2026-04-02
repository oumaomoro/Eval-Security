import express from 'express';
import crypto from 'crypto';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';
import dns from 'dns/promises';
import { supabase } from './services/supabase.service.js';
import { StartupService } from './services/startup.service.js';

// ── PRE-FLIGHT AUTOFIX ──
StartupService.runPreFlightChecks().catch(err => console.error('[Startup] Uncaught error during checks:', err));

// ── LAZY LOADING REGISTRY ──────────────────────────────────────────────────
// Modules are now just-in-time loaded to prevent Vercel cold-start timeouts.
// This is the "High ROI" serverless architecture for Express monoliths.
const loadRoute = (routeName) => async (req, res, next) => {
  try {
    console.log(`[LazyLoad] Attempting to load: ./routes/${routeName}.js`);
    const { default: router } = await import(`./routes/${routeName}.js`);
    console.log(`[LazyLoad] Successfully loaded: ${routeName}`);
    router(req, res, next);
  } catch (err) {
    console.error(`[LazyLoad] Hard Crash loading ${routeName}:`, err.message);
    next(err);
  }
};

// Environment Configuration (Surgical Restoration)
dotenv.config();


// Initialize Sentry Telemetry Safely (Optimized for Serverless)
try {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.01,
    });
    console.log('🛡️  Sentry initialized.');
  }
} catch (err) {
  console.error('⚠️  Sentry failed — disabling monitoring.', err.message);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());

// DIAGNOSTIC HOOK: Trace all 403s
app.use((req, res, next) => {
  const oldJson = res.json;
  res.json = function (data) {
    if (res.statusCode === 403) {
      console.error(`[403-DEBUG] URL: ${req.url} Data:`, JSON.stringify(data));
    }
    return oldJson.call(this, data);
  };
  next();
});

const allowedOrigins = [
  'https://costloci.com',
  'https://www.costloci.com',
  'https://api.costloci.com',
  'https://costloci-frontend.vercel.app',
  'https://backend-24hk85n8c-free-flows-projects.vercel.app', // Direct Vercel link
  'http://localhost:5180',
  'http://localhost:5173',
  'http://localhost:3001'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('CORS Not Allowed'));
    }
  },
  credentials: true
}));

// Rate limiting: 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

app.use('/api', limiter);
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Hardened Health Check: Verifies DB connectivity for True Production Readiness
app.get('/api/health', async (req, res) => {
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
    version: '1.2.3-prod', // Incremented for diagnostic phase
  });
});

app.get('/api/diag', async (req, res) => {
  const diagnostic = {
    timestamp: new Date().toISOString(),
    env: {
      has_supabase_url: !!process.env.SUPABASE_URL,
      has_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
  };

  try {
    const urlStr = process.env.SUPABASE_URL || '';
    if (urlStr) {
      const host = new URL(urlStr).hostname;
      diagnostic.dns = await dns.resolve(host).catch(err => `Error: ${err.message}`);
    } else {
      diagnostic.dns_error = 'SUPABASE_URL is missing';
    }
  } catch (err) {
    diagnostic.dns_error = err.message;
  }

  res.json(diagnostic);
});

// API Routes - OPTIMIZED FOR SERVERLESS (LAZY LOADED) ──────────────────────────
app.use('/api/auth', loadRoute('auth.routes'));
app.use('/api/contracts', loadRoute('contract.routes'));
app.use('/api/dashboard', loadRoute('dashboard.routes'));
app.use('/api/marketplace', loadRoute('marketplace.routes'));
app.use('/api/notifications', loadRoute('notifications.routes'));
app.use('/api/admin', loadRoute('admin.routes'));
app.use('/api/billing', loadRoute('billing.routes'));
app.use('/api/ai', loadRoute('ai.routes'));
app.use('/api/compliance', loadRoute('compliance.routes'));
app.use('/api/audit', loadRoute('audit.routes'));
app.use('/api/analytics', loadRoute('analytics.routes'));
app.use('/api/clauses', loadRoute('clauses.routes'));
app.use('/api/clients', loadRoute('clients.routes'));
app.use('/api/cron', loadRoute('cron.routes'));
app.use('/api/external', loadRoute('external.routes'));
app.use('/api/gold-standard', loadRoute('gold_standard.routes'));
app.use('/api/integrations', loadRoute('integrations.routes'));
app.use('/api/integrations/email', loadRoute('email_ingest.routes'));
app.use('/api/reports', loadRoute('reports.routes'));
app.use('/api/risk', loadRoute('risk.routes'));
app.use('/api/savings', loadRoute('savings.routes'));
app.use('/api/signnow', loadRoute('signnow.routes'));

// Sentry error handler (must be after all controllers, but before regular error handlers)
// Sentry.setupExpressErrorHandler(app);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Resource Not Found',
    message: `Cannot ${req.method} ${req.url}`,
    request_id: crypto.randomUUID().slice(0, 8)
  });
});

// Final Production Error Handler: Precision, Transparency, and Traceability
app.use((err, req, res, next) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.error(`[Fatal Error] (${requestId}):`, err.message);

  const statusCode = err.status || err.statusCode || 500;

  // Sentry (if enabled)
  // if (process.env.SENTRY_DSN) Sentry.captureException(err, { tags: { requestId } });

  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Internal Server Error' : err.name || 'Application Error',
    message: statusCode === 500 ? 'A critical unexpected error occurred. Please contact support.' : err.message,
    request_id: requestId, // Correlate with logs
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Costloci backend running on http://localhost:${PORT}`);
    console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  });
}

export default app;
