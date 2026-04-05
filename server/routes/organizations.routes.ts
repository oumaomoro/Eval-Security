import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";

const router = Router();

// GET /api/org/members - Fetch users in the active organization
router.get("/api/org/members", isAuthenticated, async (req: any, res) => {
  try {
    const clientId = req.user.clientId;
    if (!clientId) {
      return res.status(400).json({ message: "User is not associated with any organization" });
    }
    const members = await storage.getUsersByClientId(clientId);
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch organization members" });
  }
});

// POST /api/org/invite - Send an invite (Simulated as direct creation for now)
router.post("/api/org/invite", isAuthenticated, async (req: any, res) => {
  try {
    const clientId = req.user.clientId;
    if (!clientId) {
      return res.status(400).json({ message: "Unauthorized to invite to this organization" });
    }

    const { email, role, firstName, lastName } = api.workspaces.members.invite.input.parse(req.body);

    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = await storage.createUser({
      email,
      role,
      firstName,
      lastName,
      clientId,
    });

    res.status(201).json(newUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: "Failed to send invite" });
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
    if (!targetUser || targetUser.clientId !== clientId) {
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
