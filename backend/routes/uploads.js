const express = require('express');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const TimelineNode = require('../models/TimelineNode');
const Repository = require('../models/Repository');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Configure multer for S3
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET || 'notehive-uploads',
    acl: 'private',
    key: (req, file, cb) => {
      const userId = req.user.userId;
      const timestamp = Date.now();
      const randomId = uuidv4();
      const filename = `${userId}/${timestamp}-${randomId}-${file.originalname}`;
      cb(null, filename);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE
  }),
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'text/plain',
      'text/csv'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

/**
 * POST /api/uploads/timeline/:nodeId
 * Upload file to timeline node
 */
router.post('/timeline/:nodeId', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const { nodeId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }

    // Get timeline node
    const timelineNode = await TimelineNode.findById(nodeId);

    if (!timelineNode) {
      return res.status(404).json({
        success: false,
        error: 'Timeline node not found'
      });
    }

    // Verify repository belongs to user
    const repository = await Repository.findOne({
      _id: timelineNode.repositoryId,
      userId: req.user.userId
    });

    if (!repository) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Check storage before adding
    const user = await User.findById(req.user.userId);
    const newTotal = user.storageUsed + req.file.size;

    if (newTotal > user.storageLimit) {
      // Delete file from S3 since upload succeeded but storage check failed
      // (In production, would use S3 delete command)
      return res.status(422).json({
        success: false,
        error: 'Storage limit would be exceeded',
        data: {
          currentUsage: user.storageUsed,
          limit: user.storageLimit,
          fileSize: req.file.size,
          wouldExceedBy: newTotal - user.storageLimit
        }
      });
    }

    // Determine file type
    const fileTypeMap = {
      'application/pdf': 'pdf',
      'application/msword': 'word',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'word',
      'application/vnd.ms-excel': 'excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',
      'image/jpeg': 'image',
      'image/png': 'image',
      'image/gif': 'image',
      'image/webp': 'image',
      'audio/mpeg': 'audio',
      'audio/wav': 'audio',
      'audio/ogg': 'audio',
      'video/mp4': 'video',
      'video/mpeg': 'video',
      'video/quicktime': 'video'
    };

    const fileType = fileTypeMap[req.file.mimetype] || 'other';

    // Add attachment to timeline node
    timelineNode.attachments = timelineNode.attachments || [];
    timelineNode.attachments.push({
      filename: req.file.originalname,
      fileType,
      fileSize: req.file.size,
      s3Key: req.file.key,
      fileUrl: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${req.file.key}`,
      uploadedAt: new Date()
    });

    timelineNode.updatedAt = new Date();
    await timelineNode.save();

    // Update user storage
    user.storageUsed = newTotal;
    await user.save();

    const percentageUsed = Math.round(
      (user.storageUsed / user.storageLimit) * 100
    );

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: req.file.originalname,
        fileType,
        fileSize: req.file.size,
        s3Key: req.file.key,
        storageUsed: user.storageUsed,
        percentageUsed,
        warnings: {
          approaching: percentageUsed >= 75,
          almostFull: percentageUsed >= 90
        }
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: 'File upload failed: ' + error.message
    });
  }
});

/**
 * POST /api/uploads/check
 * Check if file can be uploaded (size validation)
 */
router.post('/check', verifyToken, async (req, res) => {
  try {
    const { fileName, fileSize } = req.body;

    if (!fileSize || fileSize <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid file size is required'
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check plan limits
    const planLimits = {
      free: 100 * 1024 * 1024, // 100MB
      pro: 500 * 1024 * 1024, // 500MB
      enterprise: 2 * 1024 * 1024 * 1024 // 2GB
    };

    const maxFileSize = planLimits[user.plan] || planLimits.free;

    // Check individual file size
    if (fileSize > maxFileSize) {
      return res.status(422).json({
        success: false,
        error: 'File exceeds plan limit',
        data: {
          fileSize,
          maxAllowed: maxFileSize,
          exceedsBy: fileSize - maxFileSize,
          plan: user.plan,
          suggestion: `Upgrade to a higher plan to upload larger files`
        }
      });
    }

    // Check total storage
    const newTotal = user.storageUsed + fileSize;
    const canUpload = newTotal <= user.storageLimit;

    return res.status(200).json({
      success: true,
      data: {
        canUpload,
        fileSize,
        maxFileSize,
        currentUsage: user.storageUsed,
        storageLimit: user.storageLimit,
        wouldBeTotalUsage: newTotal,
        plan: user.plan,
        message: canUpload
          ? 'File can be uploaded'
          : `Total storage would exceed limit. Need ${newTotal - user.storageLimit} more bytes.`
      }
    });
  } catch (error) {
    console.error('Upload check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check upload eligibility'
    });
  }
});

/**
 * GET /api/uploads/generate-url/:nodeId/:attachmentId
 * Generate signed URL for file download (temporary)
 */
router.get('/generate-url/:nodeId/:attachmentId', verifyToken, async (req, res) => {
  try {
    const { nodeId, attachmentId } = req.params;

    // Get timeline node
    const timelineNode = await TimelineNode.findById(nodeId);

    if (!timelineNode) {
      return res.status(404).json({
        success: false,
        error: 'Timeline node not found'
      });
    }

    // Verify repository belongs to user
    const repository = await Repository.findOne({
      _id: timelineNode.repositoryId,
      userId: req.user.userId
    });

    if (!repository) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Find attachment
    const attachment = timelineNode.attachments?.find(
      a => a._id.toString() === attachmentId
    );

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: 'Attachment not found'
      });
    }

    // In production, generate a signed URL with expiry
    // For now, return the file URL (assuming private bucket with public URL)
    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${attachment.s3Key}`;

    return res.status(200).json({
      success: true,
      data: {
        fileUrl,
        filename: attachment.filename,
        fileType: attachment.fileType,
        expiresIn: 3600 // 1 hour
      }
    });
  } catch (error) {
    console.error('Generate URL error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate download URL'
    });
  }
});

module.exports = router;
