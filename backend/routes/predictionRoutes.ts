import express from 'express';
import { triggerPrediction, getPredictions } from '../controllers/predictionController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/trigger', protect, admin, triggerPrediction);
router.get('/', protect, getPredictions);

export default router;
