import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Match the configuration from contract.routes.js
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // Slightly higher 15MB limit for enterprise
});

/**
 * Phase 27 Legacy Bridge:
 * The frontend uses /api/upload for standalone uploads.
 * This bridge captures the file and returns metadata that can later be linked to a contract.
 */
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided in request.' });
    }

    // Mock successful upload for workflow progression
    // In a full implementation, this would save to S3/Supabase Storage
    const fileId = crypto.randomUUID();
    
    console.log(`[UploadBridge] Received file: ${req.file.originalname} for user ${req.user.id}`);

    res.status(200).json({
      success: true,
      id: fileId,
      url: `https://api.costloci.com/uploads/temp/${fileId}`,
      filename: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('[UploadBridge] Fatal error:', error);
    res.status(500).json({ error: 'Upload bridge failed.', message: error.message });
  }
});

export default router;
