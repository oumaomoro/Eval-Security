import { type Request, type Response, type NextFunction } from "express";

/**
 * Enterprise Sanitization Middleware (Phase 32)
 * Recursively strips potentially dangerous HTML/Script tags from request bodies.
 */
export function sanitizeRequest(req: Request, res: Response, next: NextFunction) {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    const sanitized = sanitizeObject(req.query);
    // In-place modification to avoid "Cannot set property query of # which has only a getter"
    for (const key in req.query) {
      delete (req.query as any)[key];
    }
    Object.assign(req.query, sanitized);
  }
  next();
}

function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    if (typeof obj === 'string') {
      // Basic stripping of script tags and common injection vectors
      return obj
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
        .replace(/on\w+="[^"]*"/gim, "")
        .trim();
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }
  return sanitized;
}
