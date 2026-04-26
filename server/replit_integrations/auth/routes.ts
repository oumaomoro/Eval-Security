import type { Express } from "express";
import { supabase, adminClient } from "../../services/supabase.js";
import { storage } from "../../storage.js";
import { authStorage } from "./storage.js";
import { WebAuthnService } from "../../services/WebAuthn.js";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { cookieHandler } from "../../middleware/cookie-handler.js";
import { SOC2Logger } from "../../services/SOC2Logger.js";
import { EmailService } from "../../services/EmailService.js";
import { z } from "zod";
import { registrationSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../../../shared/auth-schemas.js";

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: process.env.NODE_ENV === "production" ? 10 : 100, // Permissive for dev/tests
  message: { message: "Too many authentication attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export function registerAuthRoutes(app: Express): void {
  // Apply rate limiters to authentication endpoints
  app.use("/api/auth/login", authRateLimiter);
  app.use("/api/auth/register", authRateLimiter);
  app.use("/api/auth/forgot-password", authRateLimiter);
  app.use("/api/auth/reset-password", authRateLimiter);
  app.use("/api/auth/webauthn", authRateLimiter);

  // Get current authenticated user
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      res.setHeader("X-P25-Status", "Harmonized-V1");
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      let user = await authStorage.getUser(req.user.id).catch(() => null);

      if (!user || !user.clientId) {
        user = await healUserIdentity(req.user, user);
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Email/Password Registration
  app.post("/api/auth/register", async (req: any, res) => {
    try {
      const { email, password, firstName, lastName } = registrationSchema.parse(req.body);
      // 1. Supabase Auth Secure Admin Provisioning (Verification Required)
      let registrationResult = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: false, 
        user_metadata: { first_name: firstName, last_name: lastName }
      });
      
      // FALLBACK: If admin creation fails (e.g. missing service_role key), try standard signUp
      if (registrationResult.error && (registrationResult.error.message.includes("not allowed") || registrationResult.error.message.includes("service_role"))) {
        console.warn(`[AUTH-DIAG] Admin provisioning restricted. Attempting standard Enterprise Sign-Up for ${email}...`);
        registrationResult = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { first_name: firstName, last_name: lastName }
          }
        }) as any;
      }
      
      const { data, error } = registrationResult;

      if (error) {
        if (error.message.includes("already registered")) {
          return res.status(409).json({ message: "Identity already exists. Please sign in to initialize your hub." });
        }
        throw error;
      }
      
      if (!data.user) throw new Error("Registration failed: Supabase Identity Engine did not return a valid user.");

      console.log(`[AUTH-DIAG] Registration Success: ${data.user.id}. Provisioning enterprise assets...`);

      // 2. Initial Profile Sync (Basic)
      await authStorage.upsertUser({
        id: data.user.id,
        email: data.user.email!,
        firstName,
        lastName,
        role: "admin"
      });

      // 3. Enterprise Provisioning (Org -> Client -> Workspace)
      try {
        // Note: Organization hierarchy has been unified into Workspaces/Clients (Phase 25)
        // No need to create a legacy 'organization' record.

        console.log(`[AUTH-DIAG] Provisioning Client...`);
        const client = await storage.createClient({
          companyName: `${firstName}'s Enterprise Hub`,
          industry: "Professional Services",
          contactName: `${firstName} ${lastName}`,
          contactEmail: email,
          status: "active"
        });

        console.log(`[AUTH-DIAG] Provisioning Workspace...`);
        const workspace = await storage.createWorkspace({
          name: "Main Workspace",
          ownerId: data.user.id,
          plan: "starter"
        });

        console.log(`[AUTH-DIAG] Creating Workspace Membership...`);
        await storage.addWorkspaceMember({
          userId: data.user.id,
          workspaceId: workspace.id,
          role: "owner"
        });
        
        // Link Client to Workspace (Phase 26 Harmonization)
        await storage.updateClient(client.id, { workspaceId: workspace.id });

        // 4. Harden Local User with full Enterprise Context
        await authStorage.upsertUser({
          id: data.user.id,
          email: data.user.email!,
          firstName,
          lastName,
          clientId: client.id,
          role: "admin",
          subscriptionTier: "starter"
        });

        await storage.createInfrastructureLog({
          component: "IdentityOnboarding",
          event: "ENTERPRISE_HUB_INITIALIZED",
          status: "resolved",
          actionTaken: `Success: Provisioned Org, Client, and Workspace for ${email}`
        });

      } catch (provisionErr: any) {
        console.error(`[AUTH-DIAG] Partial Provisioning Failure for ${data.user.id}:`, provisionErr.message);
        await storage.createInfrastructureLog({
          component: "IdentityOnboarding",
          event: "PARTIAL_PROVISIONING_DETECTED",
          status: "analyzing",
          actionTaken: `Partial failure for ${email}: ${provisionErr.message}. Self-healing will occur on first login.`
        });
        // We don't throw here — the user is created in Auth, and login will self-heal.
      }

      try {
        await EmailService.sendVerificationEmail(email, data.user.id);
      } catch (e) {
        console.warn("[AUTH-DIAG] Verification email failed to send, but identity is provisioned.");
      }

      res.status(201).json({ 
        message: "Costloci Hub provisioned. Please check your email to verify and activate your dashboard.",
        userId: data.user.id 
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error(`[AUTH-DIAG] Registration Critical Error:`, err.message);
      res.status(400).json({ message: err.message });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      console.log(`[AUTH-DIAG] Login Handler entry: email=${email}`);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.error(`[AUTH-DIAG] Supabase signIn error:`, error.message);
        throw error;
      }
      
      // Store session in express-session
      if (req.session) {
        req.session.supabase_token = data.session.access_token;
        req.session.expires_at = data.session.expires_at;
      }

      // 84. Sync with local DB (Harmonized Onboarding)
      let localUser = await authStorage.getUser(data.user.id).catch(() => null);

      if (!data.user.email_confirmed_at && process.env.REQUIRE_EMAIL_VERIFICATION === "true") {
        return res.status(403).json({ message: "Costloci Identity not yet verified. Please check your primary enterprise email." });
      }

      if (!localUser || !localUser.clientId) {
        localUser = await healUserIdentity(data.user, localUser);
      }

      // Secure Identity Hardening: Set HttpOnly cookie
      cookieHandler.setSessionCookie(res, data.session.access_token);

      await SOC2Logger.logEvent(req, {
        userId: data.user.id,
        action: "AUTHENTICATION_SUCCESS",
        details: "Standard credential authentication"
      });

      res.json({
        user: localUser,
        token: data.session.access_token // Keep for backwards compatibility for non-browser clients
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(401).json({ message: err.message });
    }
  });

  // Forgot Password
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      });
      if (error) throw error;
      res.json({ message: "Password reset link sent successfully." });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(400).json({ message: err.message });
    }
  });

  // Verify Email Endpoint
  app.get("/api/auth/verify", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token) return res.status(400).json({ message: "Verification token missing" });

      const { data, error } = await adminClient.auth.admin.updateUserById(
        token as string,
        { email_confirm: true }
      );

      if (error) throw error;

      res.redirect(`${process.env.FRONTEND_URL || ''}/login?verified=true`);
    } catch (err: any) {
      console.error("[AUTH-DIAG] Verification Error:", err.message);
      res.redirect(`${process.env.FRONTEND_URL || ''}/login?error=verification_failed`);
    }
  });

  // Magic Link / OTP
  app.post("/api/auth/magic-link", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.FRONTEND_URL}/auth/callback`,
        }
      });
      
      if (error) throw error;
      res.json({ message: "Magic link sent successfully." });
    } catch (err: any) {
      console.error("[AUTH-DIAG] Magic Link Error:", err.message);
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/auth/google", async (req: any, res) => {
    try {
      // The API base — used so Supabase delivers the PKCE code directly to
      // the backend, which can set HttpOnly cookies and redirect the browser.
      const apiBase = process.env.API_URL ||
        process.env.BACKEND_URL ||
        `${req.protocol}://${req.get('host')}`;

      const callbackUrl = `${apiBase}/api/auth/callback`;
      console.log(`[AUTH-DIAG] Google SSO Init. Callback URL: ${callbackUrl}`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
      
      if (data?.url) {
        res.redirect(data.url);
      } else {
        res.status(500).json({ message: "Could not generate Google Auth URL" });
      }
    } catch (err: any) {
      console.error("[AUTH-DIAG] Google SSO Error:", err.message);
      res.status(500).json({ message: "Google SSO initialization failed" });
    }
  });

  // Reset Password
  app.post("/api/auth/reset-password", async (req: any, res) => {
    try {
      const { password } = resetPasswordSchema.parse(req.body);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      res.json({ message: "Password updated successfully" });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(400).json({ message: err.message });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: any, res) => {
    cookieHandler.clearSessionCookie(res);
    req.session?.destroy((err: any) => {
      if (err) console.error("Logout session destroy failed:", err);
    });
    res.json({ message: "Logout successful" });
  });

  // Auth Callback (SSO) — backend handler
  // Supabase redirects here with ?code= after Google auth.
  // We exchange the code for a session, set the HttpOnly cookie,
  // then redirect the browser to the frontend dashboard.
  app.get("/api/auth/callback", async (req: any, res) => {
    const frontendUrl = process.env.FRONTEND_URL || '';
    try {
      const { code } = req.query;
      if (!code) {
        console.error("[AUTH-DIAG] SSO Callback: no code parameter received.");
        return res.redirect(`${frontendUrl}/auth?error=no_code`);
      }

      // Use the anon supabase client (already imported) for PKCE code exchange.
      // Supabase manages the PKCE verifier internally server-side — no need to
      // store/retrieve it ourselves between requests.
      const { data, error } = await supabase.auth.exchangeCodeForSession(code as string);
      if (error) throw error;

      if (!data.session) {
        console.error("[AUTH-DIAG] SSO Callback: code exchange returned no session.");
        return res.redirect(`${frontendUrl}/auth?error=no_session`);
      }

      // Provision or sync local identity (handles first-time Google users)
      let user = await authStorage.getUser(data.user.id).catch(() => null);
      if (!user || !user.clientId) {
        user = await healUserIdentity(data.user, user);
      }

      // Persist session token in HttpOnly cookie
      cookieHandler.setSessionCookie(res, data.session.access_token);

      // Also persist in express-session for WebAuthn flows
      if (req.session) {
        req.session.supabase_token = data.session.access_token;
      }

      await SOC2Logger.logEvent(req, {
        userId: data.user.id,
        action: "SSO_LOGIN_SUCCESS",
        details: `Google SSO login successful for ${data.user.email}`
      });

      // Redirect browser to the frontend application root
      return res.redirect(`${frontendUrl}/`);
    } catch (err: any) {
      console.error("[AUTH-DIAG] SSO Callback Error:", err.message);
      res.redirect(`${frontendUrl}/auth?error=sso_failed`);
    }
  });

  // Secure Session Initialization (Called from AuthCallback frontend if needed)
  app.post("/api/auth/session", async (req: any, res) => {
    try {
      const { access_token } = req.body;
      if (!access_token) {
        console.warn("[AUTH-DIAG] Session exchange attempt missing token.");
        return res.status(400).json({ message: "Access token required" });
      }
      
      // Set the secure HttpOnly cookie
      cookieHandler.setSessionCookie(res, access_token);

      // ── BRIDGE STATELESS TO STATEFUL (Phase 32 Auth Repair) ───────
      // We explicitly synchronize the JWT into the persistent session store.
      // This is the bridge required for WebAuthn/Biometric MFA challenges.
      if (req.session) {
        req.session.supabase_token = access_token;
      }

      // Identity validation to ensure the token is actually valid for logging
      const { data: { user }, error } = await supabase.auth.getUser(access_token);
      
      if (user && !error) {
          if (req.session) {
            req.session.expires_at = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 day parity
          }

          // ── BRIDGE IDENTITY HEALING (Phase 30 Fix) ───────
          // Ensure new SSO users are provisioned with enterprise assets
          let localUser = await authStorage.getUser(user.id).catch(() => null);
          if (!localUser || !localUser.clientId) {
            console.log(`[AUTH-DIAG] SSO Provisioning detected for ${user.email}. Running healing...`);
            await healUserIdentity(user, localUser);
          }

          await SOC2Logger.logEvent(req, {
            userId: user.id,
            action: "SSO_SESSION_ESTABLISHED",
            resourceType: "Infrastructure",
            resourceId: "AUTH_GATEWAY",
            details: `Secure HttpOnly session cookie and server-side state established via OAuth token exchange.`
          });
          console.log(`[AUTH-DIAG] SSO Session established for ${user.email} (Bridged & Healed)`);
      }

      res.json({ message: "Secure session established" });
    } catch (err: any) {
      console.error("[AUTH-DIAG] Session exchange failure:", err.message);
      res.status(500).json({ message: err.message });
    }
  });

  // API Key Rotation (Phase 32 Secure Hashing Aligned)
  app.post("/api/auth/api-key", async (req: any, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      
      const crypto = await import("crypto");
      const newApiKey = `sk.${crypto.randomBytes(24).toString('hex')}`;
      
      // storage.updateUser handles the bcrypt hashing automatically
      await storage.updateUser(req.user.id, {
        apiKey: newApiKey
      });
      
      await SOC2Logger.logEvent(req, {
        userId: req.user.id,
        action: "API_KEY_ROTATED",
        details: "User rotated platform API key via standard auth route."
      });

      res.json({ 
        message: "API key rotated successfully. This is the ONLY time it will be shown in plain text.", 
        apiKey: newApiKey,
        securityWarning: "Costloci results are hashed. We cannot recover lost keys."
      });
    } catch (err: any) {
      console.error("[API_KEY_ROTATE_ERROR]", err.message);
      res.status(500).json({ message: "Failed to rotate API key" });
    }
  });

  // --- WEBAUTHN / PASSKEY MFA ---

  app.post("/api/auth/webauthn/generate-registration", async (req: any, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const options = await WebAuthnService.generateRegistration(req.user.id);
      req.session.currentChallenge = options.challenge;
      res.json(options);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/webauthn/verify-registration", async (req: any, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const challenge = req.session.currentChallenge;
      const verification = await WebAuthnService.verifyRegistration(req.user.id, req.body, challenge);
      res.json(verification);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/webauthn/generate-authentication", async (req: any, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(404).json({ message: "User not found" });

      const options = await WebAuthnService.generateAuthentication(user.id);
      req.session.currentChallenge = options.challenge;
      req.session.pendingAuthUser = user.id;
      res.json(options);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/webauthn/verify-authentication", async (req: any, res) => {
    try {
      const challenge = req.session.currentChallenge;
      const userId = req.session.pendingAuthUser;
      if (!userId) return res.status(400).json({ message: "Authentication sequence context missing" });

      const verification = await WebAuthnService.verifyAuthentication(userId, req.body, challenge);
      
      if (verification.verified) {
        const user = await storage.getUser(userId);
        if (!user) throw new Error("User verification succeeded but profile not found");

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) throw new Error("JWT_SECRET not configured on server");

        // Sign a persistent token for the session
        // Supabase expects specific claims for its auth getUser() to work
        const payload = {
          sub: user.id,
          email: user.email,
          role: "authenticated",
          iss: "supabase", // Impersonate Supabase issuer for stateless setupAuth
        };

        const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });

        if (req.session) {
          req.session.supabase_token = token;
          req.session.expires_at = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
          delete req.session.currentChallenge;
          delete req.session.pendingAuthUser;
        }

        // Secure Identity Hardening
        cookieHandler.setSessionCookie(res, token);

        res.json({ verified: true, token, message: "Biometric verification successful" });
      } else {
        res.status(401).json({ verified: false, message: "Verification failed" });
      }
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
}

// Concurrency lock for identity healing to prevent race conditions during rapid refreshes
const healingInProgress = new Map<string, Promise<any>>();

/**
 * SOVEREIGN IDENTITY HEALING: Autocorrects provisioning failures
 */
async function healUserIdentity(authUser: any, localUser: any): Promise<any> {
  const userId = authUser.id;
  const email = authUser.email;

  if (healingInProgress.has(userId)) {
    console.log(`[IDENTITY-RESILLIENCE] Healing already in progress for ${email}. Waiting...`);
    return healingInProgress.get(userId);
  }

  const healingPromise = (async () => {
    console.log(`[IDENTITY-RESILLIENCE] Healing Identity for ${email}...`);

    try {
    // 1. Recover metadata
    const userMeta = authUser.user_metadata || {};
    let firstName = authUser.firstName || userMeta.first_name || "";
    let lastName = authUser.lastName || userMeta.last_name || "";

    // Handle Google/SSO full_name format
    if (!firstName && userMeta.full_name) {
      const parts = userMeta.full_name.split(" ");
      firstName = parts[0] || "Enterprise";
      lastName = parts.slice(1).join(" ") || "User";
    } else if (!firstName) {
      firstName = "Enterprise";
      lastName = "User";
    }

    let clientId = localUser?.clientId;

    // 2. Provision missing Client/Workspace
    if (!clientId) {
      const client = await storage.createClient({
        companyName: `${firstName}'s Enterprise Hub`,
        industry: "Professional Services",
        contactName: `${firstName} ${lastName}`,
        contactEmail: email,
        contactPhone: "",
        annualBudget: 0,
        status: "active"
      });
      clientId = client.id;

      // Persist the association to the profile
      await storage.updateUser(userId, { clientId });
      console.log(`[IDENTITY-RESILLIENCE] Created and linked Client ID ${clientId} for ${email}`);
    }

    // 3. Ensure a workspace exists for the user
    // Check if workspace already exists before creating
    const workspaces = await storage.getUserWorkspaces(userId);
    if (workspaces.length === 0) {
      const workspace = await storage.createWorkspace({
        name: "Main Workspace",
        ownerId: userId,
        plan: "starter"
      });
      const workspaceId = Array.isArray(workspace) ? workspace[0]?.id : (workspace as any).id;

      console.log(`[AUTH-DIAG] Healing Membership for ${userId}...`);
      await storage.addWorkspaceMember({
        userId,
        workspaceId,
        role: "owner"
      });
    }

    // 4. Sync local profile
    const healedUser = await authStorage.upsertUser({
      id: userId,
      email: email,
      firstName,
      lastName,
      clientId,
      role: "admin", // Explicitly force admin role for enterprise pivot
      subscriptionTier: "starter"
    });

    await storage.createInfrastructureLog({
      component: "IdentityHealing",
      event: "IDENTITY_REPAIRED",
      status: "resolved",
      actionTaken: `Atomic Identity Repair for ${email}`
    });

    return healedUser;
  } catch (err: any) {
    console.error(`[IDENTITY-RESILLIENCE] Healing CRITICAL FAILURE:`, err.message);
    return localUser; // Fallback to raw user to avoid blocking access
  } finally {
    healingInProgress.delete(userId);
  }
})();

  healingInProgress.set(userId, healingPromise);
  return healingPromise;
}
