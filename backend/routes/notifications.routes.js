import express from 'express';
import { supabase } from '../services/supabase.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/notifications
// Fetch recent unread notifications for the user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;
        res.json({ success: true, count: data.filter(n => !n.is_read).length, data });
    } catch (err) {
        console.error('[Notifications] Fetch error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/notifications/mark-read
// Mark a specific or all as read
router.post('/mark-read', authenticateToken, async (req, res) => {
    try {
        const { id } = req.body;
        
        let query = supabase.from('notifications').update({ is_read: true }).eq('user_id', req.user.id);
        
        if (id) {
            query = query.eq('id', id);
        }

        const { error } = await query;
        if (error) throw error;
        
        res.json({ success: true });
    } catch (err) {
        console.error('[Notifications] Mark read error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
