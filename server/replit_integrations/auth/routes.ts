import type { Express } from "express";
import { supabase } from "../../services/supabase";
import { storage } from "../../storage";
import { authStorage } from "./storage";
import { WebAuthnService } from "../../services/WebAuthn";

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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error("Registration failed");

      // Sync with local DB
      await authStorage.upsertUser({
        id: data.user.id,
        email: data.user.email!,
        firstName,
        lastName
      });

      // Seeding Initial Workspace & Client for Enterprise Onboarding
      const client = await storage.createClient({
        companyName: `${firstName}'s Enterprise Hub`,
        industry: "Professional Services",
        contactName: `${firstName} ${lastName}`,
        contactEmail: email,
        status: "active"
      });

      await storage.createWorkspace({
        name: "Main Workspace",
        plan: "enterprise"
      });

      // Update local user with client relationship
      await authStorage.upsertUser({
        id: data.user.id,
        email: data.user.email!,
        firstName,
        lastName,
        clientId: client.id,
        role: "admin"
      });

      res.status(201).json({ message: "Registration successful. Please verify your email." });
    } catch (err: any) {
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
      if (!req.session) {
        req.session = {};
      }
      req.session.supabase_token = data.session.access_token;
      req.session.expires_at = data.session.expires_at;

      // 84. Sync with local DB (Harmonized Onboarding)
      let localUser = await authStorage.getUser(data.user.id).catch(() => null);

      if (!localUser || !localUser.clientId) {
        console.log(`[AUTH-DIAG] Provisioning required for user ${data.user.id}`);
        // First login or missing org — Provision Client -> Workspace -> User
        const client = await storage.createClient({
          companyName: `${data.user.user_metadata?.first_name || "New"}'s Enterprise Hub`,
          industry: "Professional Services",
          contactName: `${data.user.user_metadata?.first_name || "Enterprise"} ${data.user.user_metadata?.last_name || "User"}`,
          contactEmail: data.user.email!,
          status: "active"
        });

        await storage.createWorkspace({
          name: "Main Workspace",
          ownerId: data.user.id,
          plan: "enterprise"
        });

        localUser = await authStorage.upsertUser({
          id: data.user.id,
          email: data.user.email!,
          firstName: data.user.user_metadata?.first_name,
          lastName: data.user.user_metadata?.last_name,
          clientId: client.id,
          role: "admin"
        });
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
        // Here we would also handle the login session creation
        res.json({ verified: true, message: "Biometric verification successful" });
      } else {
        res.status(401).json({ verified: false, message: "Verification failed" });
      }
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
}
