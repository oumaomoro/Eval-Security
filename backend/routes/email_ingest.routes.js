import express from 'express';
import { supabase } from '../services/supabase.service.js';
import { AnalyzerService } from '../services/analyzer.service.js';
import { EmailService, resend } from '../services/email.service.js';
import pdf from 'pdf-parse';
import { Webhook } from 'svix';
import crypto from 'crypto';

const router = express.Router();

/**
 * Helper to securely auto-provision users
 */
async function getOrCreateUserFromEmail(fromEmail) {
    let userProfile = null;
    
    // Strategy A: Exact Email Match
    const { data: exactMatch } = await supabase
      .from('profiles')
      .select('id, organization_id, tier, email')
      .eq('email', fromEmail)
      .single();

    if (exactMatch) {
      console.log(`[EmailBridge] Exact match found for ${fromEmail}`);
      userProfile = exactMatch;
      return userProfile;
    }

    // Strategy B: Domain-Based Matching (Easy Auth)
    const domain = fromEmail.split('@')[1];
    if (domain && !['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'].includes(domain.toLowerCase())) {
      console.log(`[EmailBridge] Attempting domain match for ${domain}...`);
      
      const { data: domainMatch } = await supabase
        .from('profiles')
        .select('id, organization_id, tier, email')
        .ilike('email', `%@${domain}`)
        .order('created_at', { ascending: true }) // Default to the oldest (usually the first set-up admin)
        .limit(1);

      if (domainMatch && domainMatch.length > 0) {
        console.log(`[EmailBridge] Domain match successful. Mapping ${fromEmail} to Org Admin ${domainMatch[0].email}`);
        return domainMatch[0];
      }
    }

    // Strategy C: Auto-Provision New User
    console.log(`[EmailBridge] Email ${fromEmail} unparalleled. Auto-provisioning new user profile.`);
    const tempPassword = crypto.randomBytes(16).toString('hex') + 'A1!'; // Super secure temporary password

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: fromEmail,
        password: tempPassword,
        email_confirm: true, // Auto-confirm the identity since they own the email channel they sent traversing from
        user_metadata: { role: 'user', auto_provisioned: true }
    });

    if (authError || !authData.user) {
        console.error(`[EmailBridge] Auto-Provisioning Auth Failed:`, authError?.message);
        throw authError || new Error("Auth user creation failed");
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([{
            id: authData.user.id,
            email: fromEmail,
            role: 'user',
            tier: 'free'
        }])
        .select()
        .single();
        
    if (profileError) {
        console.error(`[EmailBridge] Auto-Provisioning Profile Failed:`, profileError.message);
        throw profileError;
    }

    // Trigger explicit password reset email instead of generic welcome via standard flow
    try {
        await supabase.auth.resetPasswordForEmail(fromEmail, {
          redirectTo: `${process.env.FRONTEND_URL || 'https://costloci.com'}/reset-password`,
        });
        
        // Also send generic Welcome notice letting them know what happened
        await EmailService.sendAutoProvisionWelcome(fromEmail);
    } catch (e) {
        console.error(`[EmailBridge] Failed to trigger welcome dispatch:`, e.message);
    }

    return profile;
}

/**
 * Resend Inbound Webhook Handler (Advanced Pipeline)
 * Endpoint: POST /api/integrations/email/webhook
 */
router.post('/webhook', async (req, res) => {
  const payload = req.body;
  
  // 1. Signature Verification (Enterprise Requirement)
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (webhookSecret && req.headers['svix-id']) {
      try {
          const wh = new Webhook(webhookSecret);
          wh.verify(req.rawBody, {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"],
          });
      } catch (err) {
          console.error('[EmailBridge] Webhook Signature Verification Failed:', err.message);
          return res.status(400).json({ success: false, message: 'Invalid signature' });
      }
  }

  // Fallback payload checking if verification passes or is bypassed during dev mock tests
  const id = payload.id || payload?.data?.email_id;
  const from = payload.from || payload?.data?.from;
  const subject = payload.subject || payload?.data?.subject || 'Email Ingestion';
  const originalMessageId = payload?.data?.message_id || id;
  
  if (!id && !originalMessageId) {
      console.warn('[EmailBridge] Skipping malformed webhook structure.');
      return res.status(200).send('OK');
  }

  // 1.5. Acknowledge Receipt Immediately via Database Logs
  const { data: logEntry, error: logError } = await supabase
    .from('email_ingestion_logs')
    .insert([{ from_email: from, subject, message_id: originalMessageId, status: 'processing' }])
    .select()
    .single();

  if (logError && logError.code === '23505') { 
    // Usually means duplicate message_id! Avoid double-processing.
    console.log(`[EmailBridge] Message ID ${originalMessageId} already processed. Skipping duplicate.`);
    return res.status(200).send('Duplicate suppressed');
  }

  const internalLogId = logEntry?.id;

  try {
    // 2. Retrieve Full Email from Resend
    let text = '', html = '', attachments = [];
    
    if (id === 'dummy_id_verify_only') {
      await supabase.from('email_ingestion_logs').update({ status: 'success', error: 'Verification Test Success' }).eq('id', internalLogId);
      return res.status(200).json({ success: true, message: 'Verification Test Passed' });
    }

    const emailData = await resend.emails.get(id);
    if (!emailData) throw new Error(`Failed to retrieve email content for ID ${id}`);
    
    text = emailData.text || '';
    html = emailData.html || '';
    attachments = emailData.attachments || [];

    // 3. User Resolution & Auto-Provisioning
    const userProfile = await getOrCreateUserFromEmail(from);

    // 4. Extract and Preserve Document Content
    let contractText = text || '';
    let fileName = 'Email_Ingest.pdf';
    let fileUrl = null;

    if (attachments && attachments.length > 0) {
      const doc = attachments.find(a => a.contentType === 'application/pdf' || (a.filename && a.filename.toLowerCase().endsWith('.pdf')));
      if (doc) {
        console.log(`[EmailBridge] Found PDF attachment: ${doc.filename}`);
        fileName = doc.filename;
        const fileBuffer = Buffer.from(doc.content, 'base64');
        
        // Ensure PDF preservation natively to Bucket instead of memory dumping
        const { data: uploadData, error: uploadErr } = await supabase
          .storage
          .from('contracts')
          .upload(`email_ingest/${userProfile.id}/${id}_${fileName.replace(/\s+/g,'_')}`, fileBuffer, {
            contentType: 'application/pdf',
            upsert: false
          });
          
        if (uploadErr) console.error(`[EmailBridge] Bucket Upload Failed (Continuing to analyze in-memory):`, uploadErr.message);
        else fileUrl = uploadData.path;

        const pdfData = await pdf(fileBuffer);
        contractText = pdfData.text;
      }
    }

    if (!contractText || contractText.length < 50) {
      throw new Error('No sufficient document text found in email or attachments to perform analysis.');
    }

    // 5. Trigger AI Analysis
    console.log(`[EmailBridge] Triggering analysis for ${userProfile.email}...`);
    const analysisOptions = { userId: userProfile.id, targetLanguage: 'English' };
    
    const results = userProfile.tier === 'enterprise' 
      ? await AnalyzerService.analyzeDeep(contractText, analysisOptions)
      : await AnalyzerService.analyze(contractText, analysisOptions);

    // 6. Finalize Contract Entity
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert([{
        user_id: userProfile.id,
        organization_id: userProfile.organization_id,
        vendor_name: results.vendor_name || 'Email Ingest',
        product_service: results.product_service || 'Unknown',
        annual_cost: results.annual_cost || 0,
        renewal_date: results.renewal_date || null,
        ai_analysis: results.ai_analysis,
        file_url: fileUrl || fileName,
        email_subject: subject,
        status: 'active'
      }])
      .select()
      .single();

    if (contractError) throw contractError;

    // 7. Contextual Notification UI Push
    await supabase.from('notifications').insert([{
        user_id: userProfile.id,
        title: 'Email Analysis Complete',
        message: `Your contract from ${contract.vendor_name || 'an email ingest'} has been fully analyzed by Costloci.`,
        link_url: `/contracts/${contract.id}`
    }]);

    // 8. Output Success Log
    await supabase.from('email_ingestion_logs').update({
        status: 'success', 
        contract_id: contract.id, 
        attachment_url: fileUrl,
        processed_at: new Date().toISOString()
    }).eq('id', internalLogId);

    // 9. Dispatch Success Email to ORIGINAL sender
    await EmailService.queueEmail(
        from, 
        `✅ Analysis Ready: ${contract.vendor_name}`,
        `<h3>Your contract analysis is complete!</h3>
         <p>Our AI has finished reviewing the contract you forwarded from <b>${from}</b>.</p>
         <p><strong>Vendor:</strong> ${contract.vendor_name}</p>
         <p><strong>Risk Score:</strong> ${contract.ai_analysis?.compliance_readiness || 0}%</p>
         <br/>
         <a href="https://costloci.com/contracts/${contract.id}" style="background-color: #2c3e50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Full Report</a>`
    );

    console.log(`[EmailBridge] Successfully ingested and analyzed contract ${contract.id}`);
    res.status(200).json({ success: true, contract_id: contract.id });

  } catch (err) {
    console.error('[EmailBridge] Execution Error:', err.message);
    
    await supabase.from('email_ingestion_logs').update({
        status: 'failed', 
        error: err.message,
        processed_at: new Date().toISOString()
    }).eq('id', internalLogId);

    // Notify user of failure
    if (from && internalLogId) {
        await EmailService.queueEmail(from, `❌ Analysis Failed: ${subject}`, 
        `<p>We were unable to process the contract you forwarded via email.</p><p>Reason: ${err.message}</p>`);
    }

    res.status(200).json({ success: false, error: err.message });
  }
});

export default router;
