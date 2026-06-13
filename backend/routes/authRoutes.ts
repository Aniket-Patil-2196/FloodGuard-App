import express from 'express';
import { registerUser, loginUser, getAllUsers, updatePushToken, updateSettings, updateLocation } from '../controllers/authController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/users', protect, admin, getAllUsers);
router.post('/register-token', protect, updatePushToken);
router.put('/settings', protect, updateSettings);
router.put('/location', protect, updateLocation);

export default router;
