import express from 'express';
import { getAlerts, broadcastAlert, getActiveAlerts, getAlertStats } from '../controllers/alertController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getAlerts);

// Analytics and Broadcaster
router.get('/active', protect, getActiveAlerts);
router.get('/stats', protect, admin, getAlertStats);
router.post('/broadcast', protect, admin, broadcastAlert);

export default router;
