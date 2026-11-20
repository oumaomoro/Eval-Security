import { Response } from "express";

/**
 * SOVEREIGN IDENTITY HARDENING: Cookie Handler
 * 
 * Enforces secure, HttpOnly, SameSite attributes for enterprise session persistence.
 * Prevents XSS-based token extraction.
 */
export const cookieHandler = {
  /**
   * Sets the session cookie with the provided JWT.
   * IMPORTANT: SameSite=none + Secure=true is required for cross-domain cookie support.
   * Frontend is on costloci.com, backend is on api.costloci.com — different domains.
   * SameSite=lax would silently block all credentialed requests across these domains.
   */
  setSessionCookie(res: Response, token: string) {
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("costloci_session", token, {
      httpOnly: true,
      secure: isProd,          // Must be true when sameSite=none
      sameSite: isProd ? "none" : "lax",  // none for cross-domain in prod
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });
  },

  /**
   * Clears the session cookie.
   */
  clearSessionCookie(res: Response) {
    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie("costloci_session", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
    });
  }
};
