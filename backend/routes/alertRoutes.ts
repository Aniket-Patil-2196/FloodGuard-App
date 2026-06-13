import express from 'express';
import { getAlerts, createAlert, updateAlert, deleteAlert, broadcastAlert, getActiveAlerts, getAlertStats } from '../controllers/alertController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getAlerts);
router.post('/', protect, admin, createAlert);
router.put('/:id', protect, admin, updateAlert);
router.delete('/:id', protect, admin, deleteAlert);

// Analytics and Broadcaster
router.get('/active', protect, getActiveAlerts);
router.get('/stats', protect, admin, getAlertStats);
router.post('/broadcast', protect, admin, broadcastAlert);

export default router;
