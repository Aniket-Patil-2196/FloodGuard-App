import express from 'express';
import { handleChat, analyzeRisk } from '../controllers/chatbotController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', protect, handleChat);
router.post('/analyze', protect, analyzeRisk);

export default router;
