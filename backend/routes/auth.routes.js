import express from 'express';
import { supabase } from '../config/supabase.js';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.middleware.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'costloci-secret-2026';

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // DEV BYPASS: Allow test user registration bypass
    /*
    if (email === 'test@example.com' || email === 'demo@example.com') {
      const mockUser = { id: '00000000-0000-0000-0000-000000000000', email, role: 'user', tier: 'free' };
      const token = jwt.sign(mockUser, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ user: mockUser, token });
    }
    */

    // Create user in Supabase Auth via Admin SDK to bypass broken SMTP
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm to ensure immediate access
      user_metadata: { role: 'user' }
    });
 
    if (authError) throw authError;
 
    // Create profile in database
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        role: 'user',
        tier: 'free'
      })
      .select()
      .single();
 
    if (profileError) throw profileError;
 
    // Trigger Resend Welcome Email (Reliable Bridge)
    import('../services/email.service.js')
      .then(({ EmailService }) => EmailService.sendWelcomeEmail(email, 'Optimizor'))
      .catch(err => console.error('Failed to dispatch welcome email:', err));
 
    // Generate JWT token for seamless login
    const token = jwt.sign(
      { id: authData.user.id, email: authData.user.email, role: 'user', tier: 'free' }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
 
    res.status(201).json({
      user: { id: authData.user.id, email: authData.user.email, role: 'user', tier: 'free' },
      token
    });

    res.json({
      user: { id: authData.user.id, email: authData.user.email, role: 'user', tier: 'free' },
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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) throw profileError;

    // Generate JWT token
    const token = jwt.sign(
      { id: authData.user.id, email: authData.user.email, role: profile.role, tier: profile.tier }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      user: { id: authData.user.id, email: authData.user.email, role: profile.role, tier: profile.tier },
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
