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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Create user via Admin SDK to bypass SMTP confirmation requirement
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'user' }
    });

    if (authError) throw authError;

    // Two-pass resilient profile upsert
    let profileData = null;
    let profileError = null;

    // Pass 1: include email column
    const pass1 = await supabase.from('profiles').upsert({
      id: authData.user.id,
      email: authData.user.email,
      role: 'user',
      tier: 'free',
      updated_at: new Date().toISOString()
    }).select().maybeSingle();

    if (pass1.error) {
      console.warn('[Auth] Profile pass-1 failed:', pass1.error.message);
      // Pass 2: without email column (handles schema cache mismatch)
      const pass2 = await supabase.from('profiles').upsert({
        id: authData.user.id,
        role: 'user',
        tier: 'free',
        updated_at: new Date().toISOString()
      }).select().maybeSingle();
      profileData = pass2.data;
      profileError = pass2.error;
    } else {
      profileData = pass1.data;
    }

    if (profileError) {
      console.error('[Auth] Profile creation both passes failed:', profileError.message);
      // Non-fatal — user still gets auth token
    }

    // Send welcome email via Resend
    await EmailService.sendWelcomeEmail(email, 'Optimizor')
      .catch(err => console.error('Failed to send welcome email:', err));

    const token = jwt.sign(
      { id: authData.user.id, email: authData.user.email, role: profileData?.role || 'user', tier: profileData?.tier || 'free' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: profileData?.role || 'user',
        tier: profileData?.tier || 'free'
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    // Auto-provision profile if missing (happens when registration crashed mid-way)
    if (!profile) {
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        role: 'analyst',
        plan: 'starter'
      });
    }

    const role = profile?.role || 'user';
    const tier = profile?.tier || profile?.plan || 'free';

    // Generate JWT token
    const token = jwt.sign(
      { id: authData.user.id, email: authData.user.email, role, tier }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      user: { id: authData.user.id, email: authData.user.email, role, tier },
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

export default router;
