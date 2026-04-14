import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";
import { SignnowService } from "../services/SignnowService";
import { readFile } from "fs/promises";
import path from "path";

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
    console.error("[SignNow API ERROR]", error);
    res.status(500).json({ message: "Failed to initialize e-signature gateway." });
  }
});

export default router;
