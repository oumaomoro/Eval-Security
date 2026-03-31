import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import contractRoutes from './routes/contract.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import complianceRoutes from './routes/compliance.routes.js';
import riskRoutes from './routes/risk.routes.js';
import clausesRoutes from './routes/clauses.routes.js';
import savingsRoutes from './routes/savings.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import billingRoutes from './routes/billing.routes.js';
import adminRoutes from './routes/admin.routes.js';
import integrationsRoutes from './routes/integrations.routes.js';
import goldStandardRoutes from './routes/gold_standard.routes.js';
import auditRoutes from './routes/audit.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import cronRoutes from './routes/cron.routes.js';
import externalRoutes from './routes/external.routes.js';
import clientsRoutes from './routes/clients.routes.js';
import signnowRoutes from './routes/signnow.routes.js';

dotenv.config();

// Initialize Sentry Telemetry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0, 
  profilesSampleRate: 1.0,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Sets various HTTP headers for security
const allowedOrigins = [
  'https://costloci.com',
  'https://www.costloci.com',
  'https://cyberoptimize-frontend.pages.dev', // Fallback for direct testing
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

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.2.0',
    environment: process.env.NODE_ENV,
    monitoring: 'Sentry Active'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/clauses', clausesRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/gold-standard', goldStandardRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/external', externalRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/signnow', signnowRoutes);

// Sentry error handler (must be after all controllers, but before regular error handlers)
Sentry.setupExpressErrorHandler(app);

// Final Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[server] Unhandled error:', err.message);
  
  // Tag critical failures in Sentry for targeted alerting
  if (req.path.includes('webhook') || req.path.includes('billing')) {
    Sentry.captureException(err, { tags: { category: 'financial_transaction' } });
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    sentry: res.sentry,
    timestamp: new Date().toISOString()
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 CyberOptimize backend running on http://localhost:${PORT}`);
    console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  });
}

export default app;
