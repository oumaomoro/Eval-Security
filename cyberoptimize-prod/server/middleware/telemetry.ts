import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

let requestCount = 0;

/**
 * Real-time Telemetry Middleware
 * Samples latency and status codes for infrastructure health monitoring.
 * Logs every 100th request or any error (status >= 400).
 */
export async function telemetryMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const originalSend = res.send;

  // Type-safe override of res.send
  res.send = function (body?: any): Response {
    const duration = Date.now() - start;
    const status = res.statusCode;
    requestCount++;

    // Threshold-based logging to prevent DB bloat
    if (requestCount % 100 === 0 || status >= 400) {
      const user = (req as any).user;
      storage.createInfrastructureLog({
        status: status >= 500 ? 'critical' : status >= 400 ? 'resolving' : 'healed',
        component: "API_GATEWAY",
        event: `${req.method} ${req.path} - ${status} [${user?.ip || 'unknown'}]`,
        actionTaken: `Lat: ${duration}ms | UA: ${user?.userAgent?.substring(0, 30) || 'unknown'}`,
      }).catch(err => console.error("[TELEMETRY ERROR]", err));
    }

    return originalSend.call(this, body);
  };

  next();
}
