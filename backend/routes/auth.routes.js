import express from 'express';
import { supabase } from '../config/supabase.js';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.middleware.js';
import crypto from 'crypto';
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cyberoptimize-secret-2024';

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

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: 'user' } }
    });

    if (authError) throw authError;

    // Check if Email Confirmation is required
    const requiresVerification = !authData.session;

    // Create profile in database regardless
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

    if (requiresVerification) {
      return res.status(201).json({
        requiresVerification: true,
        message: 'Please check your email to confirm your account.',
        user: { id: authData.user.id, email: authData.user.email, role: 'user', tier: 'free' }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: authData.user.id, email: authData.user.email, role: 'user', tier: 'free' }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });
    if (error) throw error;
    res.json({ success: true, message: 'Password reset link sent to your email.' });
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

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });
    if (error) throw error;
    res.json({ success: true, message: 'Password reset link sent to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(400).json({ error: error.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { new_password } = req.body;
    // In Supabase, the user should be logged in via the token in the link
    // So we just call updateUser. 
    const { error } = await supabase.auth.updateUser({ password: new_password });
    if (error) throw error;
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/auth/google
router.get('/google', async (req, res) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.FRONTEND_URL}/dashboard`,
    },
  });
  if (error) return res.status(500).json({ error: error.message });
  res.redirect(data.url);
});

router.post('/regenerate-api-key', authenticateToken, async (req, res) => {
  try {
    const newKey = crypto.randomBytes(32).toString('hex');
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ api_key: newKey })
      .eq('id', req.user.id)
      .select('api_key')
      .single();
      
    if (error) throw error;
    res.json({ success: true, api_key: profile.api_key });
  } catch (error) {
    console.error('Failed to regenerate API key:', error);
    res.status(500).json({ error: 'Failed to regenerate API key' });
  }
});

export default router;
