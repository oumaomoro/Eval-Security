import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";

const router = Router();

// GET /api/comments - Fetch comments for a contract or audit
router.get("/api/comments", isAuthenticated, async (req: any, res) => {
  try {
    const { contractId, auditId } = api.comments.list.input.parse(req.query) || { contractId: undefined, auditId: undefined };
    const commentsList = await storage.getComments(
      contractId ? Number(contractId) : undefined,
      auditId ? Number(auditId) : undefined
    );
    res.json(commentsList);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
    res.status(500).json({ message: "Failed to fetch comments" });
  }
});

// POST /api/comments - Post a new comment
router.post("/api/comments", isAuthenticated, async (req: any, res) => {
  try {
    const input = api.comments.create.input.parse(req.body);
    // Ensure the current user's ID is used for the comment
    const comment = await storage.createComment({
      ...input,
      userId: req.user.id
    });
    res.status(201).json(comment);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
    res.status(500).json({ message: "Failed to create comment" });
  }
});

export default router;
