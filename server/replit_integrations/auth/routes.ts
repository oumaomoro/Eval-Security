import type { Express } from "express";
import { supabase, adminClient } from "../../services/supabase";
import { storage } from "../../storage";
import { authStorage } from "./storage";
import { WebAuthnService } from "../../services/WebAuthn";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { cookieHandler } from "../../middleware/cookie-handler";
import { SOC2Logger } from "../../services/SOC2Logger";
import { EmailService } from "../../services/EmailService";

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
      const { email, password, firstName, lastName } = req.body;
      // 1. Supabase Auth Secure Admin Provisioning (Verification Required)
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: false, // Force verification
        user_metadata: { first_name: firstName, last_name: lastName }
      });

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
      console.error(`[AUTH-DIAG] Registration Critical Error:`, err.message);
      res.status(400).json({ message: err.message });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const { email, password } = req.body;
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
      res.status(401).json({ message: err.message });
    }
  });

  // Forgot Password
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      });
      if (error) throw error;
      res.json({ message: "Password reset link sent successfully." });
    } catch (err: any) {
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
      const redirectBase = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
      console.log(`[AUTH-DIAG] Google SSO Init: email=${req.query.email}, redirectBase=${redirectBase}`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${redirectBase}/auth/callback`,
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
      const { password } = req.body;
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      res.json({ message: "Password updated successfully" });
    } catch (err: any) {
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

  // Auth Callback (SSO)
  app.get("/api/auth/callback", async (req: any, res) => {
    try {
      const { code } = req.query;
      if (!code) return res.redirect(`${process.env.FRONTEND_URL || ''}/login?error=no_code`);

      const { data, error } = await supabase.auth.exchangeCodeForSession(code as string);
      if (error) throw error;

      if (data.session) {
        // Sync identity and provision if first time
        let user = await authStorage.getUser(data.user.id).catch(() => null);
        if (!user || !user.clientId) {
          user = await healUserIdentity(data.user, user);
        }

        // Set secure cookie
        cookieHandler.setSessionCookie(res, data.session.access_token);
        
        if (req.session) {
          req.session.supabase_token = data.session.access_token;
        }

        await SOC2Logger.logEvent(req, {
          userId: data.user.id,
          action: "SSO_LOGIN_SUCCESS",
          details: `Google SSO login successful for ${data.user.email}`
        });
      }

      res.redirect(`${process.env.FRONTEND_URL || ''}/dashboard`);
    } catch (err: any) {
      console.error("[AUTH-DIAG] SSO Callback Error:", err.message);
      res.redirect(`${process.env.FRONTEND_URL || ''}/login?error=sso_failed`);
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

          await SOC2Logger.logEvent(req, {
            userId: user.id,
            action: "SSO_SESSION_ESTABLISHED",
            resourceType: "Infrastructure",
            resourceId: "AUTH_GATEWAY",
            details: `Secure HttpOnly session cookie and server-side state established via OAuth token exchange.`
          });
          console.log(`[AUTH-DIAG] SSO Session established for ${user.email} (Bridged to Stateful)`);
      }

      res.json({ message: "Secure session established" });
    } catch (err: any) {
      console.error("[AUTH-DIAG] Session exchange failure:", err.message);
      res.status(500).json({ message: err.message });
    }
  });

  // API Key Rotation
  app.post("/api/auth/api-key", async (req: any, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const newApiKey = `sk_live_${randomUUID().replace(/-/g, '')}`;
      const updatedUser = await storage.updateUser(req.user.id, {
        apiKey: newApiKey
      });
      res.json({ message: "API key rotated", apiKey: newApiKey });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
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

/**
 * SOVEREIGN IDENTITY HEALING: Autocorrects provisioning failures
 */
async function healUserIdentity(authUser: any, localUser: any): Promise<any> {
    const userId = authUser.id;
    const email = authUser.email;
    console.log(`[IDENTITY-RESILLIENCE] Healing Identity for ${email}...`);
    
    try {
      // 1. Recover metadata
      const userMeta = authUser.user_metadata || {};
      const firstName = authUser.firstName || userMeta.first_name || "Enterprise";
      const lastName = authUser.lastName || userMeta.last_name || "User";
      
      let clientId = localUser?.clientId;

      // 2. Provision missing Client/Workspace
      if (!clientId) {
        const client = await storage.createClient({
          companyName: `${firstName}'s Enterprise Hub`,
          industry: "Professional Services",
          contactName: `${firstName} ${lastName}`,
          contactEmail: email,
          status: "active"
        });
        clientId = client.id;

        // Check if workspace already exists before creating
        const workspaces = await storage.getUserWorkspaces(userId);
        if (workspaces.length === 0) {
            const workspace = await storage.createWorkspace({
              name: "Main Workspace",
              ownerId: userId,
              plan: "starter"
            });

            console.log(`[AUTH-DIAG] Healing Membership for ${userId}...`);
            await storage.addWorkspaceMember({
              userId,
              workspaceId: workspace.id,
              role: "owner"
            });
        }
      }

      // 3. Sync local profile
      const healedUser = await authStorage.upsertUser({
        id: userId,
        email: email,
        firstName,
        lastName,
        clientId,
        role: "admin", // Explicitly force admin role for enterprise pivot regardless of legacy trigger
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
    }
}
