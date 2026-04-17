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
   */
  setSessionCookie(res: Response, token: string) {
    res.cookie("costloci_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });
  },

  /**
   * Clears the session cookie.
   */
  clearSessionCookie(res: Response) {
    res.clearCookie("costloci_session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
  }
};
