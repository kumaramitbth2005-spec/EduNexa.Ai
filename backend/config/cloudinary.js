const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Ensure local upload directories exist as fallback
const avatarDir = path.join(__dirname, '../uploads/avatars');
const materialDir = path.join(__dirname, '../uploads/materials');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });
if (!fs.existsSync(materialDir)) fs.mkdirSync(materialDir, { recursive: true });

// Check if Cloudinary is configured
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  !process.env.CLOUDINARY_CLOUD_NAME.includes('your_')
);

let cloudinary = null;
let profileStorage = null;
let materialStorage = null;

if (isCloudinaryConfigured) {
  try {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const { CloudinaryStorage } = require('multer-storage-cloudinary');

    profileStorage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'edunexa/profiles',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 400, height: 400, crop: 'fill' }],
      },
    });

    materialStorage = new CloudinaryStorage({
      cloudinary,
      params: async (req, file) => {
        return {
          folder: 'edunexa/materials',
          resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'auto',
          allowed_formats: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'png'],
        };
      },
    });
  } catch (err) {
    console.warn('Cloudinary initialization failed, falling back to local storage:', err.message);
  }
}

// Fallback to disk storage when Cloudinary is not available or fails
if (!profileStorage) {
  profileStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, avatarDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `avatar-${req.user ? req.user.id : 'user'}-${uniqueSuffix}${ext}`);
    },
  });
}

if (!materialStorage) {
  materialStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, materialDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `material-${uniqueSuffix}${ext}`);
    },
  });
}

const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image type. Only JPG, PNG, and WebP are allowed.'), false);
    }
  },
});

const uploadMaterial = multer({
  storage: materialStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
    ];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('File type not supported. Allowed: PDF, Word, PowerPoint, Images.'), false);
  },
});

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadProfile,
  uploadMaterial,
};
