import express from 'express';
import { sendAlert, getAlerts, testSMS } from '../controllers/alertController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/send', protect, admin, sendAlert);
router.post('/test-sms', protect, admin, testSMS);
router.get('/', protect, getAlerts);

export default router;
