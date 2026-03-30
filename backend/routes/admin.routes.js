import express from 'express';
import { supabase } from '../services/supabase.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Role Verification Middleware
const protectAdmin = async (req, res, next) => {
  try {
     const { data: profile } = await supabase.from('profiles').select('role').eq('id', req.user.id).single();
     if (!profile || profile.role !== 'admin') {
        return res.status(403).json({ error: "Access Denied: Enterprise Admin Authority Required." });
     }
     next();
  } catch (error) { res.status(500).json({ error: "Authentication Database Error" }); }
}

router.use(authenticateToken);
router.use(protectAdmin);

router.get('/audit-logs', async (req, res) => {
  // We mock fetching from generic audit tables
  res.json({ success: true, logs: [{ id: 1, action: "API Key Created", user: "system" }] });
});

router.get('/webhooks', async (req, res) => {
   const { data, error } = await supabase.from('webhook_events').select('*').order('created_at', { ascending: false }).limit(50);
   res.json({ webhooks: data || [] });
});

router.get('/feedback', async (req, res) => {
   const { data, error } = await supabase.from('feedback').select(`
     *,
     profiles(email)
   `).order('created_at', { ascending: false });
   res.json({ metadata: data || [] });
});

router.get('/partners', async (req, res) => {
   const { data, error } = await supabase.from('partners').select('*');
   res.json({ partners: data || [] });
});

export default router;
