const express = require('express');
const multer = require('multer');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  uploadDocument,
  getDocuments,
  getDocument,
  deleteDocument,
  analyzeDocument,
  getReport,
} = require('../controllers/documentController');

// Multer — memory storage (we handle Cloudinary upload manually)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPG, JPEG, PNG, PDF.'));
    }
  },
});

router.use(protect);

router.get('/', getDocuments);
router.post('/upload', upload.single('document'), uploadDocument);
router.get('/:id', getDocument);
router.delete('/:id', deleteDocument);
router.post('/:id/analyze', analyzeDocument);
router.get('/:id/report', getReport);

module.exports = router;

