import { Router } from "express";
import { storage } from "../storage.js";
import { isAuthenticated } from "../replit_integrations/auth/index.js";
import { api } from "../../shared/routes.js";
import { z } from "zod";

import { SOC2Logger } from "../services/SOC2Logger.js";

const router = Router();

// GET /api/comments - Fetch comments for a contract or audit
router.get("/api/comments", isAuthenticated, async (req: any, res) => {
 try {
 const { contractId, auditId } = (api.comments.list.input as any).parse(req.query) || { contractId: undefined, auditId: undefined };
 
 // Security Guard: Verify ownership of the resource
 if (contractId) {
 const contract = await storage.getContract(Number(contractId));
 if (!contract || contract.workspaceId !== req.user.workspaceId) {
 return res.status(403).json({ message: "Access denied to this contract's comments" });
 }
 }
 if (auditId) {
 const audit = await storage.getComplianceAudit(Number(auditId));
 if (!audit || audit.workspaceId !== req.user.workspaceId) {
 return res.status(403).json({ message: "Access denied to this audit's comments" });
 }
 }

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
 
 // Security Guard: Verify ownership of the target resource
 if (input.contractId) {
 const contract = await storage.getContract(Number(input.contractId));
 if (!contract || contract.workspaceId !== req.user.workspaceId) {
 return res.status(403).json({ message: "Access denied" });
 }
 }
 if (input.auditId) {
 const audit = await storage.getComplianceAudit(Number(input.auditId));
 if (!audit || audit.workspaceId !== req.user.workspaceId) {
 return res.status(403).json({ message: "Access denied" });
 }
 }

 const comment = await storage.createComment({
 ...input,
 userId: req.user.id
 });


 await SOC2Logger.logEvent(req, {
 action: "CONTRACT_COMMENT_POSTED",
 userId: req.user.id,
 resourceType: input.contractId ? "Contract" : "ComplianceAudit",
 resourceId: String(input.contractId || input.auditId || "null"),
 details: `User posted a internal comment on ${input.contractId ? 'contract' : 'audit'}.`
 });

 res.status(201).json(comment);
 } catch (err) {
 if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
 res.status(500).json({ message: "Failed to create comment" });
 }
});

export default router;
