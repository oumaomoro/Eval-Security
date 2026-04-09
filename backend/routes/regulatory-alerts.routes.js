import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { supabase } from '../services/supabase.service.js';
import { getRescannerQueue } from '../services/queue.service.js';

const router = express.Router();

/**
 * Trigger an Autonomic Compliance Rescan
 * This endpoint fetches all active contracts and flags them for background re-evaluation
 * against updated intelligence rulesets via BullMQ.
 */
router.post('/trigger-rescan', authenticateToken, async (req, res) => {
  try {
    const { standard, alertTitle } = req.body;

    console.log(`[Rescanner] Initiating autonomic queue deployment for standard: ${standard} triggered by ${req.user.id}`);

    const rescannerQueue = getRescannerQueue();
    if (!rescannerQueue) {
        return res.status(503).json({ error: 'Background processing is currently unavailable in this environment.' });
    }

    // Place the massive computational parsing load into the safe background Redis queue
    const job = await rescannerQueue.add('AnalyzeActiveContracts', {
      user_id: req.user.id,
      organization_id: req.user.organization_id,
      payload: { standard, alertTitle }
    });

    res.json({
      success: true,
      message: 'Autonomic Compliance Rescan successfully queued. The Upstash Redis pool is actively evaluating your contracts in the background.',
      job_id: job.id
    });
  } catch (error) {
    console.error('Queue connection error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
