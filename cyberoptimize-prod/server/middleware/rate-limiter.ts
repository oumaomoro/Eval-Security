import rateLimit from "express-rate-limit";
import { type Request, type Response, type NextFunction } from "express";

/**
 * Enterprise Rate Limiter.
 * Uses express-rate-limit for basic sliding window abuse protection.
 * In a full production scenario with Redis, this would link to `workspaces.apiUsageCount`.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req, res) => {
    // If we had the workspace authenticated in the token, we would check:
    // req.user?.plan === 'starter' ? 100 : 1000
    // Currently fallback to 100 reqs per 15 mins
    return 100;
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction, options) => {
    res.status(options.statusCode).json({
      message: "API Quota Exceeded. Please upgrade your enterprise plan to increase your limit.",
      retryAfter: Math.ceil(options.windowMs / 1000)
    });
  }
});
