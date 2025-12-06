const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const upload = multer({
  storage: multerS3({
    s3: s3,
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
    // Allow common file types
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain', 'application/msword'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

module.exports = { s3, upload };
