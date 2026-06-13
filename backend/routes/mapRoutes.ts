import express from 'express';
import multer from 'multer';
import { uploadKml, getMapData, getKmlDocuments, updateKmlDocument, deleteKmlDocument } from '../controllers/mapController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-kml', protect, admin, upload.single('kml'), uploadKml);
router.get('/data', getMapData);

// KML Document Management
router.get('/kmls', protect, admin, getKmlDocuments);
router.put('/kmls/:id', protect, admin, updateKmlDocument);
router.delete('/kmls/:id', protect, admin, deleteKmlDocument);

export default router;
