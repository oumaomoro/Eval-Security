import express from 'express';
import { supabase } from '../services/supabase.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/clients - List all mapped clients for active user
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, count: data.length, clients: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clients - Create a new relational client entity
router.post('/', async (req, res) => {
  try {
    const { company_name, industry, contact_name, contact_email, contact_phone, annual_budget } = req.body;
    
    if (!company_name) return res.status(400).json({ error: "company_name is strictly required" });

    const { data, error } = await supabase.from('clients').insert([{
        user_id: req.user.id,
        company_name,
        industry,
        contact_name,
        contact_email,
        contact_phone,
        annual_budget,
        status: 'active'
    }]).select().single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('clients')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
      
    if (error) throw error;
    res.json({ success: true, message: 'Client profile detached.'});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
