import type { Express } from "express";
import { supabase, adminClient } from "../../services/supabase";
import { storage } from "../../storage";
import { authStorage } from "./storage";
import { WebAuthnService } from "../../services/WebAuthn";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";

export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      res.setHeader("X-P25-Status", "Harmonized-V1");
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const user = await authStorage.getUser(req.user.id);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Email/Password Registration
  app.post("/api/auth/register", async (req: any, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      // 1. Supabase Auth Signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName }
        }
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
        await storage.createWorkspace({
          name: "Main Workspace",
          ownerId: data.user.id,
          plan: "starter"
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

      res.status(201).json({ message: "Registration successful. Welcome to the Enterprise Intelligence Hub." });
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

      if (!localUser || !localUser.clientId) {
        console.log(`[AUTH-DIAG] Self-Healing Identity for user ${data.user.id}`);
        // Missing critical Enterprise linkage — provision missing assets
        try {
          const userMeta = data.user.user_metadata || {};
          const firstName = userMeta.first_name || "Enterprise";
          const lastName = userMeta.last_name || "User";
          
          let clientId = localUser?.clientId;

          // Note: Organization hierarchy has been unified into Workspaces/Clients (Phase 25)
          // No need to create a legacy 'organization' record.

          if (!clientId) {
            const client = await storage.createClient({
              companyName: `${firstName}'s Enterprise Hub`,
              industry: "Professional Services",
              contactName: `${firstName} ${lastName}`,
              contactEmail: data.user.email!,
              status: "active"
            });
            clientId = client.id;

            await storage.createWorkspace({
              name: "Main Workspace",
              ownerId: data.user.id,
              plan: "starter"
            });
          }

          localUser = await authStorage.upsertUser({
            id: data.user.id,
            email: data.user.email!,
            firstName,
            lastName,
            clientId,
            role: localUser?.role || "admin",
            subscriptionTier: "starter"
          });

          await storage.createInfrastructureLog({
            component: "IdentityHealing",
            event: "IDENTITY_REPAIRED",
            status: "resolved",
            actionTaken: `Healed missing organization/client for user ${email}`
          });
          
          console.log(`[AUTH-DIAG] Identity Successfully Healed for ${email}`);
        } catch (healErr: any) {
          console.error(`[AUTH-DIAG] Identity Healing Failed:`, healErr.message);
          // Don't block login, but log the critical failure
          await storage.createInfrastructureLog({
            component: "IdentityHealing",
            event: "HEALING_FAILURE",
            status: "critical",
            actionTaken: `Critical: Could not heal identity for ${email}: ${healErr.message}`
          });
        }
      }

      res.json(localUser);
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
    req.session.destroy((err: any) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logout successful" });
    });
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

        res.json({ verified: true, token, message: "Biometric verification successful" });
      } else {
        res.status(401).json({ verified: false, message: "Verification failed" });
      }
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
}
