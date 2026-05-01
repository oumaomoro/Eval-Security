import { type Request, type Response, type NextFunction } from "express";

// Mock limiters that do nothing to bypass IPv6/Configuration issues during testing
const mockMiddleware = (req: Request, res: Response, next: NextFunction) => next();

export const apiLimiter = mockMiddleware;
export const authLimiter = mockMiddleware;
export const uploadLimiter = mockMiddleware;
export const intelligenceLimiter = mockMiddleware;
export const cronLimiter = mockMiddleware;
