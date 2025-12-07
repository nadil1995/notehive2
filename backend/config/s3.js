const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

// Import AWS SDK v3 (compatible with multer-s3 v3)
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');

const uploadDir = path.join(__dirname, '../uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

let upload;
const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
const hasAllS3Config = hasAwsCredentials && process.env.AWS_BUCKET_NAME && process.env.AWS_REGION;

// Log S3 configuration status
if (hasAllS3Config) {
  logger.info('S3 configured - uploads will be stored in AWS S3', {
    metadata: { bucket: process.env.AWS_BUCKET_NAME, region: process.env.AWS_REGION }
  });
} else {
  logger.warn('S3 not fully configured - using local file storage as fallback', {
    metadata: { hasCredentials: hasAwsCredentials, hasBucket: !!process.env.AWS_BUCKET_NAME }
  });
}

// Check if AWS credentials are available
if (hasAllS3Config) {
  // Use S3 if credentials are available
  // Use AWS SDK v3 S3Client (compatible with multer-s3 v3)
  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });

  upload = multer({
    storage: multerS3({
      s3: s3Client,
      bucket: process.env.AWS_BUCKET_NAME,
      acl: 'private',
      key: function (req, file, cb) {
        const timestamp = Date.now();
        const uniqueName = `${timestamp}-${uuidv4()}-${file.originalname}`;
        cb(null, `uploads/${uniqueName}`);
      }
    }),
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      // Allow all file types for development
      cb(null, true);
    }
  });
} else {
  // Use local disk storage as fallback
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const timestamp = Date.now();
      const uniqueName = `${timestamp}-${uuidv4()}-${file.originalname}`;
      cb(null, uniqueName);
    }
  });

  upload = multer({
    storage: storage,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      // Allow all file types for development
      cb(null, true);
    }
  });
}

module.exports = { upload };
