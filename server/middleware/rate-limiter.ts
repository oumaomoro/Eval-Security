import rateLimit from "express-rate-limit";
import { type Request } from "express";

const shouldSkip = (req: Request) => {
 return process.env.NODE_ENV === "test" && req.headers['x-test-enable-rate-limit'] !== 'true';
};

const keyGenerator = (req: Request) => {
 // ipKeyGenerator: Use Workspace ID for isolation, fallback to IP
 const workspaceId = (req as any).user?.workspaceId || req.headers["x-workspace-id"];
 if (workspaceId) return `ws_${workspaceId}`;
 // Normalize IPv6 to prevent bypass
 const ip = req.ip || req.socket?.remoteAddress || "unknown";
 return ip.startsWith("::ffff:") ? ip.substring(7) : ip;
};

const ipKeyGenerator = (req: Request) => {
 // ipKeyGenerator: Normalize IPv6
 const ip = req.ip || req.socket?.remoteAddress || "unknown";
 return ip.startsWith("::ffff:") ? ip.substring(7) : ip;
};

export const apiLimiter = rateLimit({
 windowMs: 15 * 60 * 1000, // 15 minutes
 max: 300, // Enterprise: higher limit for general API
 standardHeaders: true,
 legacyHeaders: false,
 keyGenerator,
 validate: { keyGeneratorIpFallback: false },
 message: { message: "Too many requests, please try again later." },
 skip: shouldSkip
});

export const authLimiter = rateLimit({
 windowMs: 60 * 60 * 1000, // 1 hour
 max: 10, // Brute-force protection
 standardHeaders: true,
 legacyHeaders: false,
 keyGenerator: ipKeyGenerator,
 validate: { keyGeneratorIpFallback: false },
 message: { message: "Too many authentication attempts, please try again later." },
 skip: shouldSkip
});

export const uploadLimiter = rateLimit({
 windowMs: 60 * 60 * 1000, // 1 hour
 max: 50,
 standardHeaders: true,
 legacyHeaders: false,
 keyGenerator: (req) => {
 // ipKeyGenerator: Workspace isolation
 const ws = (req as any).user?.workspaceId || req.headers["x-workspace-id"];
 if (ws) return `upload_ws_${ws}`;
 const ip = req.ip || req.socket?.remoteAddress || "unknown";
 return ip.startsWith("::ffff:") ? ip.substring(7) : ip;
 },
 validate: { keyGeneratorIpFallback: false },
 message: { message: "Upload rate limit exceeded for this workspace." },
 skip: shouldSkip
});

export const intelligenceLimiter = rateLimit({
 windowMs: 15 * 60 * 1000, // 15 min
 max: 30, // Limit AI inference calls per workspace
 standardHeaders: true,
 legacyHeaders: false,
 keyGenerator: (req) => {
 // ipKeyGenerator: Workspace isolation
 const ws = (req as any).user?.workspaceId || req.headers["x-workspace-id"];
 if (ws) return `ai_ws_${ws}`;
 const ip = req.ip || req.socket?.remoteAddress || "unknown";
 return ip.startsWith("::ffff:") ? ip.substring(7) : ip;
 },
 validate: { keyGeneratorIpFallback: false },
 message: { message: "Intelligence API rate limit exceeded." },
 skip: shouldSkip
});

export const cronLimiter = rateLimit({
 windowMs: 60 * 1000, // 1 min
 max: 5, // Limit cron executions
 standardHeaders: true,
 legacyHeaders: false,
 keyGenerator: ipKeyGenerator,
 validate: { keyGeneratorIpFallback: false },
 message: { message: "Cron rate limit exceeded." },
 skip: shouldSkip
});
