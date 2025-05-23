import express from 'express';
import { purchaseNumber } from '../services/telnyxService';

const router = express.Router();

// POST /api/telnyx/purchase-number
router.post('/purchase-number', async (req, res) => {
  const { phoneNumber } = req.body;
  try {
    const result = await purchaseNumber(phoneNumber);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as any).message });
  }
});

// GET /api/telnyx/sip-credentials (for demo, in production secure this!)
router.get('/sip-credentials', (req, res) => {
  // In production, fetch credentials securely per user/session
  res.json({
    username: process.env.TELNYX_SIP_USERNAME,
    password: process.env.TELNYX_SIP_PASSWORD,
    connection_id: process.env.TELNYX_CONNECTION_ID
  });
});

export default router; 