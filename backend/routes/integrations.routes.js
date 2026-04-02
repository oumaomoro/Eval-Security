import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Middleware to verify JWT token and inject req.user
// (assuming auth tokens are sent as Bearer tokens in headers)
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { SignnowService } from '../services/signnow.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'costloci-secret-2026';
const upload = multer({ storage: multer.memoryStorage() });

const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized token' });
  }
};

// 1. SignNow Direct Integration: Push Redlines to E-Signature
router.post('/signnow/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error("Missing file buffer in payload");
    }

    // Attempt to grab token from header, body, or User Metadata
    let token = req.body.token;

    // If not overtly provided, lookup the user DB profile to see if they saved it in settings
    if (!token) {
      const { data: userData } = await supabase.auth.admin.getUserById(req.user.id);
      token = userData?.user?.user_metadata?.signnow_token;
    }

    if (!token) {
      throw new Error("Missing SignNow API Token. Please add it in your Settings > Integrations.");
    }

    // Step 1: Upload the dynamically generated Word Doc
    const uploadResult = await SignnowService.uploadDocument(token, req.file.buffer, req.file.originalname);

    // Optional Step 2: If an invite email was provided, immediately send it to the queue
    if (req.body.inviteEmail) {
      await SignnowService.sendInvite(token, uploadResult.id, req.body.inviteEmail);
    }

    res.json({ success: true, document_id: uploadResult.id, message: 'Successfully routed to SignNow Queue' });
  } catch (err) {
    console.error('[SignNow Route] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1. Get all connected integrations for current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('integrations')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    // Fallback if the JSONB column isn't created yet or is null
    res.json({ success: true, integrations: profile?.integrations || {} });
  } catch (error) {
    console.error('[integrations] Error fetching integrations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch integrations status' });
  }
});

// /status alias — frontend uses /integrations/status
router.get('/status', requireAuth, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('integrations')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;
    res.json({ success: true, integrations: profile?.integrations || {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch integrations status' });
  }
});

// 2. Obtain an OAuth Authorization URL
// The frontend calls this silently to get the real live URL to redirect the user to.
router.get('/:provider/auth-url', requireAuth, (req, res) => {
  const { provider } = req.params;
  const validProviders = ['docusign', 'slack', 'jira', 'ironclad'];

  if (!validProviders.includes(provider)) {
    return res.status(400).json({ error: 'Unsupported integration provider' });
  }

  const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
  // Redirect back to the frontend settings page
  const redirectUri = `${process.env.FRONTEND_URL || 'http://127.0.0.1:5180'}/settings`;

  // We use state to prevent CSRF and pass the provider back safely
  const state = JSON.stringify({
    provider,
    uid: req.user.id,
    timestamp: Date.now()
  });

  // Base64 encode state for URL safety
  const safeState = Buffer.from(state).toString('base64');

  if (clientId) {
    console.log(`[integrations] Generating LIVE OAuth URL for ${provider}`);
    const authUrls = {
      docusign: `https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature&client_id=${clientId}&redirect_uri=${redirectUri}&state=${safeState}`,
      slack: `https://slack.com/oauth/v2/authorize?scope=chat:write,channels:read&client_id=${clientId}&redirect_uri=${redirectUri}&state=${safeState}`,
      jira: `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${clientId}&scope=read:jira-work write:jira-work&redirect_uri=${redirectUri}&state=${safeState}&response_type=code`
    };
    return res.json({ success: true, auth_url: authUrls[provider] || redirectUri });
  } else {
    console.error(`[integrations] Implementation Error: ${provider.toUpperCase()}_CLIENT_ID missing in production.`);
    return res.status(500).json({ error: `${provider} integration is not configured.` });
  }
});

// 3. Handle the returned OAuth code to exchange tokens
router.post('/callback', requireAuth, async (req, res) => {
  const { code, state } = req.body;

  if (!code || !state) {
    return res.status(400).json({ error: 'Authorization code or state is missing' });
  }

  try {
    // Decode state
    const decodedStateStr = Buffer.from(state, 'base64').toString('utf-8');
    const statePayload = JSON.parse(decodedStateStr);
    const provider = statePayload.provider;

    // Validate state (ensure it belongs to the same user)
    if (statePayload.uid !== req.user.id) {
      return res.status(403).json({ error: 'OAuth state mismatch - potential CSRF' });
    }

    let tokenData;
    const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];

    if (clientId) {
      // TODO: Execute server-to-server POST to exchange 'code' for an access token
      // E.g., await fetch('https://account-d.docusign.com/oauth/token', ...)
      throw new Error(`Real token exchange pending config for ${provider}`);
    } else {
      throw new Error(`${provider} integration is not configured.`);
    }

    // Read current integrations
    const { data: profile, error: readError } = await supabase
      .from('profiles')
      .select('integrations')
      .eq('id', req.user.id)
      .single();

    if (readError) throw readError;

    const currentIntegrations = profile?.integrations || {};

    // Add/Update provider tokens
    currentIntegrations[provider] = tokenData;

    // Save back to Supabase
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ integrations: currentIntegrations })
      .eq('id', req.user.id);

    if (updateError) throw updateError;

    res.json({ success: true, provider, data: { status: 'connected' } });

  } catch (error) {
    console.error(`[integrations] Callback error:`, error);
    res.status(500).json({ success: false, error: error.message || 'Failed to process authentication callback' });
  }
});

// 4. Disconnect integration
router.delete('/:provider', requireAuth, async (req, res) => {
  const { provider } = req.params;

  try {
    const { data: profile, error: readError } = await supabase
      .from('profiles')
      .select('integrations')
      .eq('id', req.user.id)
      .single();

    if (readError) throw readError;

    const currentIntegrations = profile?.integrations || {};

    if (currentIntegrations[provider]) {
      delete currentIntegrations[provider];
    } else {
      return res.json({ success: true, message: 'Already disconnected' });
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ integrations: currentIntegrations })
      .eq('id', req.user.id);

    if (updateError) throw updateError;

    res.json({ success: true, message: `${provider} successfully disconnected` });
  } catch (error) {
    console.error(`[integrations] Disconnect error:`, error);
    res.status(500).json({ success: false, error: `Failed to disconnect ${provider}` });
  }
});

// 5. DocuSign Webhook: Automated Ingestion
router.post('/docusign/webhook', async (req, res) => {
  const { event, data } = req.body;

  try {
    console.log(`[DocuSign Webhook] Received event: ${event}`);

    if (event === 'envelope-completed') {
      const envelopeId = data?.envelopeId;
      const userId = data?.customFields?.find(f => f.name === 'costloci_user_id')?.value;

      if (!userId) {
        console.warn(`[DocuSign Webhook] No costloci_user_id found in custom fields for envelope ${envelopeId}`);
        return res.status(200).json({ success: true, message: 'Skipped - No user mapping' });
      }

      console.log(`[DocuSign Webhook] Processing completed envelope ${envelopeId} for user ${userId}`);

      // MOCK: In a real scenario, we would use the DocuSign SDK to download the PDF buffer here.
      // const pdfBuffer = await DocusignService.downloadEnvelope(envelopeId);

      // For now, we simulate a successful ingestion trigger
      // Note: We would typically call a service here to handle the background analysis
      console.log(`[DocuSign Webhook] Triggering automated AI analysis for envelope ${envelopeId}...`);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('[DocuSign Webhook] Error:', err.message);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
});

export default router;
