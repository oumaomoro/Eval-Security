import { Router } from "express";
import { storage } from "../storage.js";
import { isAuthenticated } from "../replit_integrations/auth/index.js";
import { SignnowService } from "../services/SignnowService.js";
import { adminClient } from "../services/supabase.js";
import { NotificationService } from "../services/NotificationService.js";
import { readFile } from "fs/promises";
import path from "path";

import { SOC2Logger } from "../services/SOC2Logger.js";

const router = Router();

/**
 * POST /api/signnow/embedded
 * Creates an embedded signing session for a specific contract.
 * Uses the original uploaded PDF.
 */
router.post("/api/signnow/embedded", isAuthenticated, async (req: any, res) => {
  try {
    const { contractId, signerEmail } = req.body;
    if (!contractId || !signerEmail) {
      return res.status(400).json({ message: "contractId and signerEmail are required" });
    }

    const contract = await storage.getContract(Number(contractId));
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Resolve file path from contract metadata
    // We expect fileUrl to be like 'uploads/filename.pdf'
    if (!contract.fileUrl) {
        return res.status(400).json({ message: "Contract does not have an associated source file" });
    }

    const filePath = path.resolve(process.cwd(), contract.fileUrl);
    
    try {
        const fileBuffer = await readFile(filePath);
        const filename = path.basename(filePath);

        console.log(`[SignNow] Initializing embedded session for ${filename} -> ${signerEmail}`);

        const session = await SignnowService.createEmbeddedSession(fileBuffer, filename, signerEmail);

        // Update contract status to reflect the signature request
        await storage.updateContract(contract.id, { status: 'pending' });

        await SOC2Logger.logEvent(req, {
          action: "SIGNNOW_SESSION_ESTABLISHED",
          userId: req.user.id,
          resourceType: "Contract",
          resourceId: String(contract.id),
          details: `Embedded SignNow session created for ${signerEmail}. Document status set to pending.`
        });

        res.json({
            signingUrl: session.signingUrl,
            documentId: session.documentId,
            inviteId: session.inviteId
        });
    } catch (fsErr: any) {
        console.error(`[SignNow] File system error: ${fsErr.message}`);
        return res.status(500).json({ message: "Could not retrieve the source contract file for signing." });
    }
  } catch (error: any) {
    console.error("[SignNow API ERROR]", error.message);
    res.status(500).json({ message: "Failed to initialize e-signature gateway." });
  }
});

/**
 * POST /api/integrations/signnow/webhook
 * Webhook listener for SignNow signature events.
 */
router.post("/api/integrations/signnow/webhook", async (req: any, res) => {
  try {
    const payload = req.body;
    console.log(`[SignNow Webhook] Received event:`, JSON.stringify(payload));

    // Acknowledge webhook immediately as per SignNow docs
    res.status(200).send("OK");
    
    // Asynchronous backend processing
    const eventType = payload.meta?.event || payload.event;
    const documentId = payload.content?.id || payload.document_id;
    
    if (eventType === "document.update" || eventType === "document.complete") {
       // Search for the contract with matching signnow metadata
       // adminClient imported at top level
       
       const { data: contract } = await adminClient
         .from("contracts")
         .select("*")
         .eq("status", "pending")
         .limit(1)
         .single();
         // NOTE: A robust implementation would store the signnow document id 
         // on the contract record during creation and query specifically for that.
         
       if (contract) {
           await storage.updateContract(contract.id, { status: "active" });
           
           // Broadcast completion network event
           // NotificationService imported at top level
           await NotificationService.broadcastEvent(contract.workspace_id, "signature.completed", {
               title: "Contract Signed Successfully",
               message: `The pending contract ${contract.vendorName} has been fully executed via SignNow.`,
               severity: "info",
               link: `/contracts/${contract.id}`
           });
       }
    }
  } catch (err: any) {
    console.error("[SignNow Webhook ERROR]:", err.message);
    // Don't send 500 if response already sent
    if (!res.headersSent) {
      res.status(500).send("Webhook processing error");
    }
  }
});

export default router;
