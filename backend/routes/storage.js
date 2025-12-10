const express = require('express');
const User = require('../models/User');
const TimelineNode = require('../models/TimelineNode');
const Repository = require('../models/Repository');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * GET /api/storage/usage
 * Get current user's storage usage statistics
 */
router.get('/usage', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      'storageUsed storageLimit plan'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const percentageUsed = Math.round(
      (user.storageUsed / user.storageLimit) * 100
    );

    const storageRemaining = user.storageLimit - user.storageUsed;

    return res.status(200).json({
      success: true,
      data: {
        storageUsed: user.storageUsed,
        storageLimit: user.storageLimit,
        storageRemaining,
        percentageUsed,
        plan: user.plan,
        warnings: {
          approaching: percentageUsed >= 75,
          almostFull: percentageUsed >= 90
        }
      }
    });
  } catch (error) {
    console.error('Get storage usage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch storage usage'
    });
  }
});

/**
 * GET /api/storage/breakdown
 * Get storage breakdown by repository
 */
router.get('/breakdown', async (req, res) => {
  try {
    // Get all user's repositories
    const repositories = await Repository.find(
      { userId: req.user.userId },
      '_id name'
    ).lean();

    const breakdown = [];

    // Calculate storage for each repository
    for (const repo of repositories) {
      const nodes = await TimelineNode.find(
        { repositoryId: repo._id },
        'attachments'
      ).lean();

      let totalSize = 0;
      let fileCount = 0;

      nodes.forEach(node => {
        if (node.attachments && Array.isArray(node.attachments)) {
          node.attachments.forEach(attachment => {
            totalSize += attachment.fileSize || 0;
            fileCount++;
          });
        }
      });

      breakdown.push({
        repositoryId: repo._id,
        repositoryName: repo.name,
        storageUsed: totalSize,
        fileCount,
        percentage: 0 // Will calculate below
      });
    }

    // Get total storage
    const user = await User.findById(req.user.userId).select('storageUsed');
    const totalStorage = user.storageUsed || 0;

    // Calculate percentages
    breakdown.forEach(item => {
      item.percentage = totalStorage > 0 ?
        Math.round((item.storageUsed / totalStorage) * 100) : 0;
    });

    // Sort by storage used (descending)
    breakdown.sort((a, b) => b.storageUsed - a.storageUsed);

    return res.status(200).json({
      success: true,
      data: breakdown,
      totalStorage,
      repositoryCount: repositories.length
    });
  } catch (error) {
    console.error('Get storage breakdown error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch storage breakdown'
    });
  }
});

/**
 * POST /api/storage/check
 * Check if user can upload a file
 */
router.post('/check', async (req, res) => {
  try {
    const { fileSize } = req.body;

    if (!fileSize || fileSize <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid file size is required'
      });
    }

    const user = await User.findById(req.user.userId).select(
      'storageUsed storageLimit plan'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const newTotal = user.storageUsed + fileSize;
    const canUpload = newTotal <= user.storageLimit;
    const spaceNeeded = Math.max(0, newTotal - user.storageLimit);

    return res.status(200).json({
      success: true,
      data: {
        canUpload,
        currentUsage: user.storageUsed,
        limit: user.storageLimit,
        fileSize,
        wouldBeTotalUsage: newTotal,
        spaceNeeded,
        message: canUpload
          ? 'Upload allowed'
          : `Not enough space. Need ${spaceNeeded} more bytes.`
      }
    });
  } catch (error) {
    console.error('Storage check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check storage'
    });
  }
});

/**
 * POST /api/storage/update
 * Update user's storage used (called after successful file upload)
 */
router.post('/update', async (req, res) => {
  try {
    const { fileSize } = req.body;

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

    // Check if adding this file would exceed limit
    const newTotal = user.storageUsed + fileSize;
    if (newTotal > user.storageLimit) {
      return res.status(422).json({
        success: false,
        error: 'Storage limit would be exceeded',
        data: {
          currentUsage: user.storageUsed,
          limit: user.storageLimit,
          fileSize,
          wouldExceedBy: newTotal - user.storageLimit
        }
      });
    }

    // Update storage
    user.storageUsed = newTotal;
    await user.save();

    const percentageUsed = Math.round(
      (user.storageUsed / user.storageLimit) * 100
    );

    return res.status(200).json({
      success: true,
      message: 'Storage updated successfully',
      data: {
        storageUsed: user.storageUsed,
        storageLimit: user.storageLimit,
        percentageUsed,
        warnings: {
          approaching: percentageUsed >= 75,
          almostFull: percentageUsed >= 90
        }
      }
    });
  } catch (error) {
    console.error('Storage update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update storage'
    });
  }
});

/**
 * GET /api/storage/plan
 * Get current plan details
 */
router.get('/plan', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      'plan storageLimit'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const planDetails = {
      free: {
        name: 'Free',
        storageLimit: 5 * 1024 * 1024 * 1024, // 5GB
        maxFileSize: 100 * 1024 * 1024, // 100MB
        price: '$0/month'
      },
      pro: {
        name: 'Pro',
        storageLimit: 50 * 1024 * 1024 * 1024, // 50GB
        maxFileSize: 500 * 1024 * 1024, // 500MB
        price: '$9.99/month'
      },
      enterprise: {
        name: 'Enterprise',
        storageLimit: 1000 * 1024 * 1024 * 1024, // 1TB
        maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
        price: 'Custom'
      }
    };

    const currentPlan = planDetails[user.plan] || planDetails.free;

    return res.status(200).json({
      success: true,
      data: {
        currentPlan: user.plan,
        ...currentPlan,
        storageLimit: user.storageLimit // Actual limit (may be different for enterprise)
      }
    });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plan details'
    });
  }
});

module.exports = router;
