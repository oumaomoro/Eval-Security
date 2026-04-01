import express from 'express';
import crypto from 'crypto';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';

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

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

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
app.use(helmet()); // Sets various HTTP headers for security
const allowedOrigins = [
  'https://costloci.com',
  'https://www.costloci.com',
  'https://costloci-frontend.vercel.app', // Vercel frontend fallback
  'https://costloci-frontend.pages.dev',  // Cloudflare Pages fallback
  'http://localhost:5180',
  'http://localhost:5173'
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
    const { error } = await supabase.from('gold_standards').select('id', { count: 'exact', head: true }).limit(1);
    dbStatus = error ? 'degraded' : 'connected';
  } catch (err) {
    dbStatus = 'unreachable';
  }

  res.status(dbStatus === 'connected' ? 200 : 503).json({
    status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    version: '1.2.0-prod',
    region: process.env.VERCEL_REGION || 'edge'
  });
});

// API Routes - OPTIMIZED FOR SERVERLESS (LAZY LOADED) ──────────────────────────
app.use('/api/auth', loadRoute('auth.routes'));
app.use('/api/contracts', loadRoute('contract.routes'));
app.use('/api/dashboard', loadRoute('dashboard.routes'));
app.use('/api/marketplace', loadRoute('marketplace.routes'));
app.use('/api/notifications', loadRoute('notifications.routes'));
app.use('/api/settings', loadRoute('settings.routes'));
app.use('/api/admin', loadRoute('admin.routes'));
app.use('/api/stripe', loadRoute('stripe.routes'));
app.use('/api/resend', loadRoute('resend.routes'));
app.use('/api/integrations/email', loadRoute('email_ingest.routes'));
app.use('/api/ai', loadRoute('ai.routes'));
app.use('/api/compliance', loadRoute('compliance.routes'));
app.use('/api/audit', loadRoute('audit.routes'));
app.use('/api/notifications', loadRoute('notifications.routes'));

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
