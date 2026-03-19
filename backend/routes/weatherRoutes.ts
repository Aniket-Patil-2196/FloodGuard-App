import express from 'express';
import { getWeatherData, getWeatherHistory, getNews } from '../controllers/weatherController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/news', protect, getNews);
router.get('/:city', protect, getWeatherData);
router.get('/history', protect, getWeatherHistory);

export default router;
