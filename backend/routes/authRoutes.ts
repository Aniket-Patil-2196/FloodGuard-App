import express from 'express';
import { registerUser, loginUser, getAllUsers, updatePushToken, updateSettings } from '../controllers/authController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/users', protect, admin, getAllUsers);
router.post('/register-token', protect, updatePushToken);
router.put('/settings', protect, updateSettings);

export default router;
