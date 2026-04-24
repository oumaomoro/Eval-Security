import { Request, Response, NextFunction } from "express";
import { storage } from "../storage.js";

/**
 * ENTERPRISE API AUTHENTICATION
 * 
 * Validates 'X-API-KEY' header against the sovereign user database.
 * Supports stateless B2B integrations for Phase 27 Gateway.
 */
export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey) {
    return res.status(401).json({ 
      error: "unauthorized",
      message: "Enterprise API Key is required in X-API-KEY header." 
    });
  }

  try {
    const user = await storage.getUserByApiKey(apiKey);
    if (!user) {
      return res.status(401).json({ 
        error: "invalid_key",
        message: "The provided API key is invalid or has been revoked." 
      });
    }

    // Attach user and workspace context to the request
    (req as any).user = user;
    
    // Auto-resolve primary workspace for the user if not provided
    const workspace = await storage.getDefaultWorkspace(user.id);
    (req as any).workspaceId = workspace?.id;

    next();
  } catch (err: any) {
    console.error("[API-AUTH-ERROR]", err.message);
    res.status(500).json({ error: "internal_error", message: "Failed to authenticate API request." });
  }
}
