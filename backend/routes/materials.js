const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getMaterials, getMaterial, uploadMaterial, updateMaterial, deleteMaterial, trackDownload } = require('../controllers/materialController');
const { uploadMaterial: uploadToCloud } = require('../config/cloudinary');

router.get('/', protect, getMaterials);
router.get('/:id', protect, getMaterial);
router.post('/', protect, authorize('teacher', 'admin'), uploadToCloud.single('file'), uploadMaterial);
router.put('/:id', protect, authorize('teacher', 'admin'), updateMaterial);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteMaterial);
router.post('/:id/download', protect, trackDownload);

module.exports = router;

