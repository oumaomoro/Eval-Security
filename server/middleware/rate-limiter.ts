import rateLimit from "express-rate-limit";
import { type Request, type Response, type NextFunction } from "express";

const shouldSkip = (req: Request) => {
  return process.env.NODE_ENV === "test" && req.headers['x-test-enable-rate-limit'] !== 'true';
};

const keyGenerator = (req: Request) => {
  // Enterprise Guard: Use Workspace ID for isolation, fallback to IP
  const workspaceId = (req as any).user?.workspaceId || req.headers["x-workspace-id"];
  return workspaceId ? `ws_${workspaceId}` : req.ip || "unknown";
};

const ipKeyGenerator = (req: Request) => {
  return req.ip || "unknown";
};

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Enterprise: higher limit for general API
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  // @ts-ignore - TS types for express-rate-limit might not include ipKeyGenerator
  ipKeyGenerator,
  message: { message: "Too many requests, please try again later." },
  skip: shouldSkip
});

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Brute-force protection
  standardHeaders: true,
  legacyHeaders: false,
  // @ts-ignore - TS types for express-rate-limit might not include ipKeyGenerator
  ipKeyGenerator,
  message: { message: "Too many authentication attempts, please try again later." },
  skip: shouldSkip
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, 
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ws = (req as any).user?.workspaceId || req.headers["x-workspace-id"];
    return ws ? `upload_ws_${ws}` : req.ip || "unknown";
  },
  // @ts-ignore - TS types for express-rate-limit might not include ipKeyGenerator
  ipKeyGenerator,
  message: { message: "Upload rate limit exceeded for this workspace." },
  skip: shouldSkip
});

export const intelligenceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 30, // Limit AI inference calls per workspace
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ws = (req as any).user?.workspaceId || req.headers["x-workspace-id"];
    return ws ? `ai_ws_${ws}` : req.ip || "unknown";
  },
  // @ts-ignore - TS types for express-rate-limit might not include ipKeyGenerator
  ipKeyGenerator,
  message: { message: "Intelligence API rate limit exceeded." },
  skip: shouldSkip
});

export const cronLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 5, // Limit cron executions
  standardHeaders: true,
  legacyHeaders: false,
  // @ts-ignore - TS types for express-rate-limit might not include ipKeyGenerator
  ipKeyGenerator,
  message: { message: "Cron rate limit exceeded." },
  skip: shouldSkip
});
