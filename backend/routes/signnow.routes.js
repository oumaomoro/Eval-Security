import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { supabase } from '../services/supabase.service.js';
import { SignnowService } from '../services/signnow.service.js';
import pdf from 'pdfkit'; // We will use this to generate a summary for SignNow

const router = express.Router();

/**
 * POST /api/signnow/embedded
 * Creates an e-signature session for a contract and returns the embedded URL
 */
router.post('/embedded', authenticateToken, async (req, res) => {
  try {
    const { contract_id, signer_email } = req.body;

    if (!contract_id || !signer_email) {
      return res.status(400).json({ error: 'Contract ID and Signer Email are required' });
    }

    // 1. Fetch contract from DB
    const { data: contract, error: contractErr } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contract_id)
      .eq('user_id', req.user.id)
      .single();

    if (contractErr || !contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // 2. Generate a "Signable Summary" PDF
    // For simplicity, we create a PDF buffer here to send to SignNow
    // In a real app, you might send the original contract file.
    const doc = new pdf();
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    
    // Generate PDF Content
    doc.fontSize(20).text(`CyberOptimize: E-Signature Request`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Vendor: ${contract.vendor_name}`);
    doc.text(`Product/Service: ${contract.product_service}`);
    doc.text(`Annual Cost: $${(contract.annual_cost || 0).toLocaleString()}`);
    doc.moveDown();
    doc.fontSize(12).text('By signing below, you acknowledge the security and risk analysis performed by CyberOptimize AI.');
    doc.moveDown(4);
    doc.text('_________________________________', { align: 'left' });
    doc.text(`Authorized Signer: ${signer_email}`);
    doc.end();

    const pdfBuffer = await new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });

    // 3. Dispatch to SignNow Service
    const filename = `${contract.vendor_name.replace(/\s+/g, '_')}_Signature_Request.pdf`;
    const session = await SignnowService.createEmbeddedSession(pdfBuffer, filename, signer_email);

    // 4. Store in Signatures table
    const { data: signature, error: sigError } = await supabase
      .from('signatures')
      .insert([{
        user_id: req.user.id,
        contract_id: contract.id,
        signer_email,
        signnow_document_id: session.documentId,
        embedded_url: session.signingUrl,
        status: 'sent',
        metadata: { invite_id: session.inviteId }
      }])
      .select()
      .single();

    if (sigError) throw sigError;

    res.json({ success: true, data: signature });
  } catch (err) {
    console.error('[SignNow Route] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/signnow/status/:id
 * Polls the status of a signature request
 */
router.get('/status/:id', authenticateToken, async (req, res) => {
  try {
    const { data: signature, error } = await supabase
      .from('signatures')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !signature) {
      return res.status(404).json({ error: 'Signature record not found' });
    }

    // Here you would typically poll SignNow API as well, or rely on webhooks
    // For now, we return the DB state.
    res.json({ success: true, data: signature });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
