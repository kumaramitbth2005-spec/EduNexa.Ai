const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const {
  checkCertificateEligibility,
  generateCertificate,
  verifyCertificate,
  getCertificateDetails,
} = require('../controllers/certificateController');

// Course-scoped certificate actions
router.get('/course/:courseId/eligibility', protect, checkCertificateEligibility);
router.post('/course/:courseId/generate', protect, generateCertificate);

// Public Certificate Verification
router.get('/verify/:certificateId', verifyCertificate);

// Retrieve full certificate by ID
router.get('/:certificateId', optionalAuth, getCertificateDetails);

module.exports = router;

