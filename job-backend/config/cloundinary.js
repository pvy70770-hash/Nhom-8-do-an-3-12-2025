// ===================== CLOUDINARY CONFIGURATION =====================
// Cloudinary dùng để upload và quản lý file (CV, avatars, logos)

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Validate Cloudinary config
const validateConfig = () => {
  const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.warn(`⚠️ Missing Cloudinary config: ${missing.join(', ')}`);
    console.warn('⚠️ File upload features will not work without Cloudinary credentials');
    return false;
  }
  
  console.log('✅ Cloudinary configured successfully');
  return true;
};

validateConfig();

// ===================== STORAGE CONFIGURATIONS =====================

// CV Storage
const cvStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'job-portal/cvs',
    allowed_formats: ['pdf', 'doc', 'docx'],
    resource_type: 'raw',
    public_id: (req, file) => `cv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
});

// Avatar Storage
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'job-portal/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 500, height: 500, crop: 'fill', gravity: 'face' },
      { quality: 'auto' }
    ],
    public_id: (req, file) => `avatar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
});

// Company Logo Storage
const logoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'job-portal/logos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'svg', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'pad', background: 'white' },
      { quality: 'auto' }
    ],
    public_id: (req, file) => `logo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
});

// ===================== MULTER UPLOAD INSTANCES =====================

// CV Upload (max 5MB)
const uploadCV = multer({
  storage: cvStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX are allowed.'));
    }
  }
});

// Avatar Upload (max 2MB)
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, GIF, WEBP are allowed.'));
    }
  }
});

// Logo Upload (max 2MB)
const uploadLogo = multer({
  storage: logoStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, SVG, WEBP are allowed.'));
    }
  }
});

// ===================== HELPER FUNCTIONS =====================

/**
 * Delete file from Cloudinary
 * @param {String} publicId - Public ID of the file
 * @param {String} resourceType - 'image' or 'raw'
 */
const deleteFile = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    
    if (result.result === 'ok') {
      console.log(`✅ Deleted file: ${publicId}`);
      return true;
    } else {
      console.warn(`⚠️ File not found or already deleted: ${publicId}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error deleting file ${publicId}:`, error.message);
    return false;
  }
};

/**
 * Get file URL with transformations
 * @param {String} publicId - Public ID of the file
 * @param {Object} options - Transformation options
 */
const getFileUrl = (publicId, options = {}) => {
  try {
    return cloudinary.url(publicId, options);
  } catch (error) {
    console.error('❌ Error generating file URL:', error.message);
    return null;
  }
};

/**
 * Upload base64 image
 * @param {String} base64String - Base64 encoded image
 * @param {String} folder - Folder name in Cloudinary
 */
const uploadBase64 = async (base64String, folder = 'job-portal/temp') => {
  try {
    const result = await cloudinary.uploader.upload(base64String, {
      folder: folder,
      resource_type: 'auto'
    });
    
    console.log(`✅ Uploaded base64 image to ${folder}`);
    return result;
  } catch (error) {
    console.error('❌ Error uploading base64 image:', error.message);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadCV,
  uploadAvatar,
  uploadLogo,
  deleteFile,
  getFileUrl,
  uploadBase64
};