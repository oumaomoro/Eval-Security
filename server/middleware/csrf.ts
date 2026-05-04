import { type Request, type Response, type NextFunction } from "express";

/**
 * Enterprise CSRF Protection Middleware
 * Expects the 'x-csrf-token' header on all state-mutating HTTP methods.
 * Bypassed ONLY if an established 'Authorization: Bearer' token is provided, assuming API consumptions.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const isStateMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
  
  if (!isStateMutating) {
    return next();
  }

  // Bypass for public auth endpoints — these are rate-limited and stateless;
  // unauthenticated clients cannot obtain a CSRF token before calling them.
  const publicAuthPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/refresh',
    '/api/billing/paypal-webhook',
    '/api/billing/paystack-webhook',
    '/api/cron/pulse',
  ];
  if (publicAuthPaths.some(p => req.originalUrl.startsWith(p))) {
    return next();
  }

  // Bypass for API calls relying on programmatic Bearer tokens (Server to Server & CLI flows)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  // CSRF verification for Cookie/Browser-based sessions
  const csrfToken = req.headers['x-csrf-token'];
  const expectedSecret = process.env.CSRF_SECRET || 'dev_csrf_fallback_32';

  if (!csrfToken || csrfToken !== expectedSecret) {
    console.error(`[SECURITY] CSRF Validation Failed on ${req.method} ${req.originalUrl}. Token: ${csrfToken}`);
    return res.status(403).json({
      error: "Forbidden",
      message: "Invalid or missing Anti-CSRF token."
    });
  }

  next();
}
