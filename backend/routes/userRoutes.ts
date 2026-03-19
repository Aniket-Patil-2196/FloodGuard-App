import express from 'express';
import { getUserProfile } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/profile', protect, getUserProfile);

export default router;
