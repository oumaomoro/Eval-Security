import express from 'express';
import { supabase } from '../services/supabase.service.js';
import { EmailService } from '../services/email.service.js';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.middleware.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'costloci-secret-2026';

router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    console.log(`[Auth/Register] Attempting registration for: ${email}`);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Resilient Enterprise registration using Admin SDK to bypass SMTP blocks
    let authData, authError;
    const adminResp = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'admin' }
    });
    authData = adminResp.data;
    authError = adminResp.error;

    if (authError) {
      console.error('[Auth/Register] Supabase Admin createUser failed:', authError.message);
      // Fallback to standard signup if Admin key is missing/restricted
      if (authError.message.includes('Service Role key')) {
          console.warn('[Auth/Register] Service Role missing - falling back to standard signUp');
          const fallback = await supabase.auth.signUp({ 
              email, 
              password,
              options: { emailRedirectTo: `${process.env.FRONTEND_URL}/dashboard` }
          });
          if (fallback.error) throw fallback.error;
          authData = fallback.data;
      } else {
          throw authError;
      }
    }

    if (!authData?.user) {
        console.error('[Auth/Register] Registration returned no user data.');
        throw new Error('Authentication gateway returned null user.');
    }

    const userId = authData.user.id;
    console.log(`[Auth/Register] User created in Auth: ${userId}`);

    // ── DEFINITIVE MULTI-TENANCY PROVISIONING ────────────────────────────
    const orgName = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1) + "'s Organization";
    const workspaceName = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1) + "'s Workspace";
    const slug = `${email.split('@')[0]}-${crypto.randomBytes(3).toString('hex')}`;
    
    console.log(`[Auth/Register] Provisioning Enterprise Environment for: ${email}`);
    
    // 1. Create Organization (Primary Anchor)
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert([{ name: orgName, slug, tier: 'free' }])
      .select()
      .single();

    if (orgError) {
      console.error('[Auth/Register] Organization creation failed:', orgError.message);
    }
    const orgId = organization?.id || null;

    // 2. Create Workspace (Backbone Support - ADAPTIVE ID)
    let workspaceId = null;
    if (orgId) {
        const { data: workspace, error: wsError } = await supabase
            .from('workspaces')
            .insert([{ 
                name: workspaceName, 
                owner_id: userId,
                plan: 'enterprise'
            }])
            .select()
            .single();
            
        if (wsError) {
            console.error('[Auth/Register] Workspace creation failed:', wsError.message);
        }
        workspaceId = workspace?.id || null;
    }

    // 3. Atomically Link Profile (Hybrid ID Sync)
    console.log(`[Auth/Register] Initializing profile for user ${userId}`);
    const profilePayload = {
      id: userId,
      email: authData.user.email,
      role: 'admin',
      tier: 'free',
      organization_id: orgId, // Store UUID
      client_id: workspaceId, // Store Integer
      first_name: firstName,
      last_name: lastName,
      updated_at: new Date().toISOString()
    };

    const { error: profileError } = await supabase.from('profiles').upsert(profilePayload);
    if (profileError) throw profileError;

    // ── RESILIENT NOTIFICATION LAYER ──────────────────────────
    // Non-blocking dispatch to ensure registration success regardless of SMTP state
    console.log(`[Auth/Register] Queueing welcome email...`);
    EmailService.sendWelcomeEmail(email, 'Optimizor')
      .catch(err => console.error('[Auth/Register] Non-critical notification failure:', err.message));

    const token = jwt.sign(
      { 
        id: userId, 
        email: authData.user.email, 
        role: 'admin', 
        tier: 'free',
        organization_id: orgId
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`[Auth/Register] Registration flow complete.`);
    res.status(201).json({
      user: {
        id: userId,
        email: authData.user.email,
        role: 'owner',
        tier: 'free',
        organization_id: orgId
      },
      token
    });
  } catch (error) {
    console.error('[Auth/Register] Fatal registration error:', error);
    res.status(500).json({ 
        error: 'Registration failed due to an internal server error.',
        details: error.message,
        path: '/api/auth/register'
    });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // DEV BYPASS: Hardcoded test users for local E2E verification
    /*
    if (email === 'test@example.com' && (password === 'password123' || password === 'test123456')) {
      const mockUser = { 
        id: '00000000-0000-0000-0000-000000000000', 
        email: 'test@example.com', 
        role: 'user', 
        tier: 'free' 
      };
      const token = jwt.sign(mockUser, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ user: mockUser, token });
    }

    if (email === 'admin@example.com' && password === 'admin123456') {
      const adminUser = { 
        id: '11111111-1111-1111-1111-111111111111', 
        email: 'admin@example.com', 
        role: 'admin', 
        tier: 'pro' 
      };
      const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ user: adminUser, token });
    }
    */

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      if (authError.message.includes('Email not confirmed')) {
        return res.status(403).json({ error: 'Email not confirmed', requiresVerification: true });
      }
      throw authError;
    }

    // Get user profile — use maybeSingle() to handle missing profiles gracefully
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    // ── PHASE 14: SELF-HEALING & ORG PROVISIONING ─────────────────────
    if (!profile || !profile.organization_id) {
      console.log(`[Auth] Self-healing organization for user: ${authData.user.id}`);
      
      const orgName = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1) + "'s Workspace";
      const slug = `${email.split('@')[0]}-${crypto.randomBytes(3).toString('hex')}`;
      
      const { data: organization } = await supabase
        .from('organizations')
        .insert([{ name: orgName, slug, tier: 'free' }])
        .select()
        .single();

      if (organization) {
        const profileUpdate = {
          id: authData.user.id,
          organization_id: organization.id,
          role: profile?.role || 'owner'
        };
        const { data: updatedProfile } = await supabase.from('profiles').upsert(profileUpdate).select().single();
        profile = updatedProfile || { ...profile, ...profileUpdate };
      }
    }
    // ───────────────────────────────────────────────────────────────────

    const role = profile?.role || 'owner';
    const tier = profile?.tier || profile?.plan || 'free';
    const organization_id = profile?.organization_id || null;

    // Generate JWT token
    const token = jwt.sign(
      { id: authData.user.id, email: authData.user.email, role, tier, organization_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: { id: authData.user.id, email: authData.user.email, role, tier, organization_id },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message || 'Invalid credentials' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Generate an absolute recovery link via Admin SDK
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      }
    });

    if (error) throw error;

    const resetLink = data.properties.action_link;

    // Dispatch via Resend (Bypass broken Supabase SMTP)
    const { EmailService } = await import('../services/email.service.js');
    await EmailService.sendPasswordResetEmail(email, resetLink);

    res.json({ success: true, message: 'Password reset link sent to your email via Resend.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.body;
    // Note: Supabase reset flow usually requires the user to be in a session (verified by token/hash from email)
    // Here we wrap the logic for the backend to finalize if needed, but often handled clientside.
    const { data, error } = await supabase.auth.updateUser({ password: new_password });
    if (error) throw error;
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/google/callback', async (req, res) => {
  // Logic for handling Google OAuth redirect and session exchange
  // Usually handled by Supabase clientside, but backend might need to sync the profile
  res.redirect(`${process.env.FRONTEND_URL}/dashboard?auth=sso_sync`);
});

// End duplicate block

// GET /api/auth/google
router.get('/google', async (req, res) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.FRONTEND_URL}/dashboard`,
      },
    });
    if (error) {
      // Catch the missing OAuth secret error proactively
      if (error.message.includes('missing OAuth secret') || error.status === 400) {
        console.error('[Auth] Google OAuth Misconfigured: Missing Client Secret in Supabase Dashboard.');
        return res.status(400).json({
          error: 'OAuth provider misconfigured. Please contact support (missing client secret).',
          details: 'Admin: Add the Google Client Secret to your Supabase project under Auth > Providers.'
        });
      }
      throw error;
    }
    res.redirect(data.url);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me OR /api/auth/user - Verify current session and return user profile
router.get(['/me', '/user'], authenticateToken, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*, organizations(*)')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: profile.role,
        tier: profile.tier,
        organization_id: profile.organization_id,
        organization: profile.organizations,
        first_name: profile.first_name,
        last_name: profile.last_name
      }
    });
  } catch (error) {
    console.error('Auth/Me error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

router.post('/regenerate-api-key', authenticateToken, async (req, res) => {
  try {
    const rawKey = `sk_${crypto.randomBytes(24).toString('hex')}`;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawKey, salt);

    const { error } = await supabase
      .from('profiles')
      .update({
        api_key: hash,
        api_key_hashed: true
      })
      .eq('id', req.user.id);

    if (error) throw error;

    // The rawKey is returned ONLY here and never stored in plaintext
    res.json({ success: true, api_key: rawKey });
  } catch (error) {
    console.error('Failed to regenerate API key:', error);
    res.status(500).json({ error: 'Failed to regenerate API key' });
  }
});

router.all('/logout', async (req, res) => {
  // On Vercel we just clear the token cookies if any, but since we use JWT in memory usually,
  // we just redirect to home.
  res.clearCookie('token');
  res.redirect('/');
});

export default router;
