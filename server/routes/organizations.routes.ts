import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";

const router = Router();

// GET /api/org/members - Fetch users in the active organization
router.get("/api/org/members", isAuthenticated, async (req: any, res) => {
  try {
    const orgId = req.user.organizationId;
    const clientId = req.user.clientId;
    
    if (!orgId && !clientId) {
      return res.status(400).json({ message: "User is not associated with any organization" });
    }

    // Provisioning fallback: If we have an Org ID, use it. Else fallback to legacy Client ID.
    const members = orgId 
      ? await storage.getUsersByOrganizationId(orgId)
      : await storage.getUsersByClientId(clientId);
      
    res.json(members);
  } catch (error) {
    console.error("[ORG ROUTES] Member listing failed:", error);
    res.status(500).json({ message: "Failed to fetch organization members" });
  }
});

// POST /api/org/invite - Send an invite (Simulated as direct creation for now)
router.post("/api/org/invite", isAuthenticated, async (req: any, res) => {
  try {
    const orgId = req.user.organizationId;
    const clientId = req.user.clientId;

    if (!orgId && !clientId) {
      return res.status(400).json({ message: "Unauthorized to invite to this organization" });
    }

    const { email, role, firstName, lastName } = api.workspaces.members.invite.input.parse(req.body);

    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const { adminClient } = await import('../services/supabase');
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: "InvitedUser123!",
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName }
    });

    if (authError || !authData.user) {
      throw new Error(`Auth Provisioning Error: ${authError?.message || "Unknown error"}`);
    }

    const { authStorage } = await import('../replit_integrations/auth/storage');
    const newUser = await authStorage.upsertUser({
      id: authData.user.id,
      email,
      role,
      firstName,
      lastName,
      clientId
    });

    res.status(201).json(newUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    if (error instanceof Error) {
      return res.status(500).json({ message: `Failed to send invite: ${error.message}` });
    }
    return res.status(500).json({ message: `Failed to send invite: ${(error as Error)?.message || String(error)}` });
  }
});

// PUT /api/org/member - Update a member's role
router.put("/api/org/member", isAuthenticated, async (req: any, res) => {
  try {
    const clientId = req.user.clientId;

    if (!clientId) {
      return res.status(400).json({ message: "Unauthorized" });
    }

    const { userId, role } = api.workspaces.members.updateRole.input.parse(req.body);

    const targetUser = await storage.getUser(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Security check: Match Client ID anchor
    const isMemberOfOrg = clientId && targetUser.clientId === clientId;
    if (!isMemberOfOrg) {
      return res.status(404).json({ message: "Member not found in your organization" });
    }

    const updatedUser = await storage.updateUser(userId, { role });
    res.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: "Failed to update member role" });
  }
});

export default router;
