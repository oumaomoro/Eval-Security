import rateLimit from "express-rate-limit";
import { type Request, type Response, type NextFunction } from "express";

/**
 * Standard API Limit.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, 
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction, options) => {
    res.status(options.statusCode).json({
      message: "API Quota Exceeded. Please upgrade your enterprise plan to increase your limit.",
      retryAfter: Math.ceil(options.windowMs / 1000)
    });
  }
});

/**
 * Strict Limit for Authentication Endpoints (Brute-force protection).
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "test" ? 1000000 : (process.env.NODE_ENV === "development" ? 100 : 5), // Relaxed for dev, strict for prod
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too Many Requests",
    message: "Too many authentication attempts from this IP, please try again after 15 minutes",
  }
});

/**
 * Strict Rate Limiter for Document Uploads (Preventing DDoS and Storage Abuse).
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 Hour
  max: process.env.NODE_ENV === "test" ? 1000000 : (process.env.NODE_ENV === "development" ? 100 : 20), // 20 Uploads per hour per user
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    return req.user?.id?.toString() || req.ip || 'anonymous';
  },
  message: {
    error: "Quota Exceeded",
    message: "Maximum document upload limits reached. Please wait before submitting more contracts."
  }
});

/**
 * AI Intelligence Limiter (Phase 32)
 * Protects expensive LLM resources from exhaustion.
 */
export const intelligenceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 Hour
  max: process.env.NODE_ENV === "test" ? 1000000 : (process.env.NODE_ENV === "development" ? 100 : 30), // 30 AI calls per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Intelligence Quota Exceeded",
    message: "You have reached your hourly AI processing limit. High-density analysis is throttled to ensure availability."
  }
});

/**
 * Cron/Background Task Limiter
 * Ensures system jobs aren't triggered externally too frequently.
 */
export const cronLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 Minute
  max: 5, // Only 5 triggers per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
     error: "System Overload",
     message: "Background processing queue is currently saturated."
  }
});
