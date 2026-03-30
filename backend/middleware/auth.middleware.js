import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { supabase, isSupabaseConfigured } from '../services/supabase.service.js';

dotenv.config();

// Supabase JWT secret — derived from the anon key's JWT payload
// The signature is verified against Supabase's JWKS; for simplicity we decode without verifying signature
// and use the user ID from the payload to scope queries. Full signature verification uses the JWT secret
// found in Project Settings > API > JWT Settings.
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
const LEGACY_JWT_SECRET = process.env.JWT_SECRET || 'cyberoptimize-secret-2024';

// DEV BYPASS user ID (matches mock data handlers)
const DEV_USER_ID = '00000000-0000-0000-0000-000000000000';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // Allow token in query string for one-click file downloads (Strategic Reports/Audit Packs)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // ── Try Supabase Token Verification (Production Standard) ────────────────────
  if (isSupabaseConfigured()) {
    try {
      const { data: { user: sbUser }, error: sbError } = await supabase.auth.getUser(token);
      
      if (!sbError && sbUser) {
        // Enforce Email Verification strictly at the middleware level
        if (!sbUser.email_confirmed_at) {
          return res.status(403).json({ error: 'Email not confirmed', requiresVerification: true, message: 'Please verify your email address to access this resource.' });
        }

        req.user = {
          id: sbUser.id,
          email: sbUser.email,
          role: sbUser.user_metadata?.role || 'authenticated',
          organization_id: sbUser.user_metadata?.organization_id || null
        };

        // Attach granular DB roles from profiles table (optional enhancement)
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, organization_id')
            .eq('id', sbUser.id)
            .single();
            
          if (profile) {
            req.user.role = profile.role || req.user.role;
            req.user.organization_id = profile.organization_id || req.user.organization_id;
          }
        } catch (dbErr) {
          console.warn('[auth] Profile fetch skipped (table might not exist yet)');
        }

        return next();
      }
    } catch (err) {
      console.error('[auth] Supabase verification error:', err.message);
    }
  }

  // ── DEV BYPASS: decode without signature verification (development only) ───────
  if (process.env.NODE_ENV !== 'production') {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.sub) {
        req.user = {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role || 'authenticated'
        };
        return next();
      }
    } catch (e) { /* invalid token format */ }
  }

  return res.status(403).json({ 
    error: 'Access Forbidden', 
    message: 'Invalid or expired security token. Please sign in again.' 
  });
};

// Middleware to strongly enforce Admin-only roles
export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden: Administrator access required.' });
};

// Middleware to block Viewers from mutating data
export const requireAnalystOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'analyst')) {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden: Viewers cannot modify data.' });
};

// Phase 21: High-Margin Enterprise Tier Gating
export const requireEnterprisePlan = async (req, res, next) => {
  if (req.user && req.user.id && isSupabaseConfigured()) {
    try {
      const { data: profile } = await supabase.from('profiles').select('plan').eq('id', req.user.id).single();
      if (profile && profile.plan === 'enterprise') {
        return next();
      }
    } catch (dbErr) {
      console.error('[auth] Profile plan fetch error:', dbErr);
    }
  }
  return res.status(403).json({ 
    error: 'Enterprise Subscription Required', 
    message: 'This high-token synthesis feature is restricted to Enterprise partners. Please upgrade to unlock.' 
  });
};

// Phase 2: Enhanced Tier & Trial Limit checking
export const checkContractLimit = async (userId) => {
  if (!isSupabaseConfigured()) return { allowed: true, limit: Infinity, tier: 'mock' };
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('tier, trial_start, trial_end, trial_used')
      .eq('id', userId)
      .single();

    if (error) return { allowed: true, limit: 5, tier: 'free' };

    const tier = profile.tier || 'free';
    if (tier === 'enterprise') return { allowed: true, limit: Infinity, tier };
    if (tier === 'professional' || tier === 'pro') return { allowed: true, limit: 50, tier };
    if (tier === 'starter') return { allowed: true, limit: 10, tier };
    
    // Check 14-day Free Trial
    if (profile.trial_end && new Date(profile.trial_end) > new Date()) {
      return { allowed: true, limit: 5, isTrial: true, tier: 'trial' };
    }

    // Default Free Tier (after trial expires or no sub)
    return { allowed: true, limit: 2, tier: 'expired' }; 
  } catch (dbErr) {
    console.error('[auth] Profile limit fetch error:', dbErr);
    return { allowed: true, limit: 5 }; // Fallback
  }
};
