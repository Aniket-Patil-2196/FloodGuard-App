import express from 'express';
import multer from 'multer';
import { uploadKml, getMapData } from '../controllers/mapController';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-kml', upload.single('kml'), uploadKml);
router.get('/data', getMapData);

export default router;
