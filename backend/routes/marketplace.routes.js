import express from 'express';
import { supabase } from '../config/supabase.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'costloci-secret-2026';

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

// 1. Get all active marketplace items
router.get('/items', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('status', 'active')
      .order('sales_count', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Create a new marketplace listing (Seller)
router.post('/items', requireAuth, async (req, res) => {
  const { name, description, category, content, price } = req.body;

  try {
    const { data, error } = await supabase
      .from('marketplace_items')
      .insert([{
        seller_id: req.user.id,
        name,
        description,
        category,
        content,
        price,
        status: 'active'
      }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Record a Sale (Buyer - Simplified for manual payout phase)
router.post('/purchase', requireAuth, async (req, res) => {
  const { itemId, stripePaymentId } = req.body;

  try {
    // 1. Get item details for price
    const { data: item, error: itemError } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError) throw itemError;

    // 2. Record the sale (Trigger in DB will handle 70/30 split)
    const { data: sale, error: saleError } = await supabase
      .from('marketplace_sales')
      .insert([{
        item_id: itemId,
        seller_id: item.seller_id,
        buyer_id: req.user.id,
        total_price: item.price,
        stripe_payment_id: stripePaymentId,
        status: 'completed'
      }])
      .select()
      .single();

    if (saleError) throw saleError;

    // 3. Increment sales count
    await supabase.rpc('increment_sales_count', { item_uid: itemId });

    res.json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
