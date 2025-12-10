const express = require('express');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Repository = require('../models/Repository');
const TimelineNode = require('../models/TimelineNode');
const Plan = require('../models/Plan');
const { verifyToken, verifyRole } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(verifyRole('admin'));

/**
 * Helper: Log admin action
 */
async function logAdminAction(adminId, action, targetUserId, details = {}) {
  try {
    const auditLog = new AuditLog({
      adminId,
      action,
      targetUser: targetUserId,
      details,
      ipAddress: '0.0.0.0', // In production, get from request
      userAgent: 'AdminAPI',
      timestamp: new Date()
    });
    await auditLog.save();
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

// ============================================
// USER MANAGEMENT ENDPOINTS
// ============================================

/**
 * GET /api/admin/users
 * List all users with optional filtering and pagination
 */
router.get('/users', async (req, res) => {
  try {
    const { search, plan, role, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    let query = {};

    // Search by username or email
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { username: searchRegex },
        { email: searchRegex },
        { displayName: searchRegex }
      ];
    }

    // Filter by plan
    if (plan) {
      query.plan = plan;
    }

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit) || 20);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await User.countDocuments(query);

    // Get users
    const users = await User.find(query)
      .select('-passwordHash -refreshTokens')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

/**
 * GET /api/admin/users/:userId
 * Get specific user details with storage info
 */
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-passwordHash -refreshTokens')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get repository count
    const repoCount = await Repository.countDocuments({ userId });

    // Get timeline node count
    const nodeCount = await TimelineNode.countDocuments({
      repositoryId: { $in: await Repository.find({ userId }, '_id') }
    });

    // Get plan details
    const plan = await Plan.findOne({ name: user.plan }).lean();

    return res.status(200).json({
      success: true,
      data: {
        ...user,
        stats: {
          repositories: repoCount,
          timelineNodes: nodeCount,
          storageUsed: user.storageUsed,
          storageLimit: user.storageLimit,
          storagePercentage: Math.round((user.storageUsed / user.storageLimit) * 100)
        },
        planDetails: plan
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
});

/**
 * PUT /api/admin/users/:userId
 * Update user information
 */
router.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { displayName, email, isActive } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update fields
    if (displayName) user.displayName = displayName;
    if (email) user.email = email.toLowerCase();
    if (isActive !== undefined) user.isActive = isActive;
    user.updatedAt = new Date();

    await user.save();

    // Log action
    await logAdminAction(req.user.userId, 'USER_UPDATED', userId, {
      displayName,
      email,
      isActive
    });

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
});

/**
 * PUT /api/admin/users/:userId/plan
 * Change user plan and update storage limit
 */
router.put('/users/:userId/plan', async (req, res) => {
  try {
    const { userId } = req.params;
    const { planName } = req.body;

    if (!planName) {
      return res.status(400).json({
        success: false,
        error: 'Plan name is required'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Validate plan exists
    const plan = await Plan.findOne({ name: planName });

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }

    const oldPlan = user.plan;
    user.plan = planName;
    user.storageLimit = plan.storageLimit;
    user.updatedAt = new Date();

    await user.save();

    // Log action
    await logAdminAction(req.user.userId, 'PLAN_CHANGED', userId, {
      oldPlan,
      newPlan: planName,
      newStorageLimit: plan.storageLimit
    });

    return res.status(200).json({
      success: true,
      message: `User plan changed from ${oldPlan} to ${planName}`,
      data: {
        userId,
        plan: user.plan,
        storageLimit: user.storageLimit
      }
    });
  } catch (error) {
    console.error('Change plan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change plan'
    });
  }
});

/**
 * POST /api/admin/users/:userId/suspend
 * Suspend user account
 */
router.post('/users/:userId/suspend', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.isActive = false;
    user.updatedAt = new Date();
    await user.save();

    // Log action
    await logAdminAction(req.user.userId, 'USER_SUSPENDED', userId, {
      reason: 'Suspended by admin'
    });

    return res.status(200).json({
      success: true,
      message: 'User account suspended',
      data: { userId, isActive: user.isActive }
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suspend user'
    });
  }
});

/**
 * POST /api/admin/users/:userId/unsuspend
 * Restore user account
 */
router.post('/users/:userId/unsuspend', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.isActive = true;
    user.updatedAt = new Date();
    await user.save();

    // Log action
    await logAdminAction(req.user.userId, 'USER_UPDATED', userId, {
      action: 'Account restored'
    });

    return res.status(200).json({
      success: true,
      message: 'User account restored',
      data: { userId, isActive: user.isActive }
    });
  } catch (error) {
    console.error('Restore user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restore user'
    });
  }
});

/**
 * POST /api/admin/users/:userId/adjust-storage
 * Adjust user storage limit
 */
router.post('/users/:userId/adjust-storage', async (req, res) => {
  try {
    const { userId } = req.params;
    const { storageLimit } = req.body;

    if (!storageLimit || storageLimit <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid storage limit is required'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const oldLimit = user.storageLimit;
    user.storageLimit = storageLimit;
    user.updatedAt = new Date();
    await user.save();

    // Log action
    await logAdminAction(req.user.userId, 'STORAGE_ADJUSTED', userId, {
      oldLimit,
      newLimit: storageLimit,
      difference: storageLimit - oldLimit
    });

    return res.status(200).json({
      success: true,
      message: 'Storage limit adjusted',
      data: {
        userId,
        oldLimit,
        newLimit: user.storageLimit
      }
    });
  } catch (error) {
    console.error('Adjust storage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to adjust storage'
    });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Delete user account (hard delete)
 */
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { permanent } = req.query;

    if (userId === req.user.userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (permanent === 'true') {
      // Hard delete: remove all user data
      const repos = await Repository.find({ userId });
      for (const repo of repos) {
        await TimelineNode.deleteMany({ repositoryId: repo._id });
      }
      await Repository.deleteMany({ userId });
      await User.findByIdAndDelete(userId);

      // Log action
      await logAdminAction(req.user.userId, 'USER_DELETED', userId, {
        permanent: true,
        repositoriesDeleted: repos.length
      });

      return res.status(200).json({
        success: true,
        message: 'User and all associated data permanently deleted'
      });
    } else {
      // Soft delete: deactivate account
      user.isActive = false;
      user.updatedAt = new Date();
      await user.save();

      // Log action
      await logAdminAction(req.user.userId, 'USER_DELETED', userId, {
        permanent: false
      });

      return res.status(200).json({
        success: true,
        message: 'User account deactivated'
      });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
});

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

/**
 * GET /api/admin/analytics/users
 * Get user statistics
 */
router.get('/analytics/users', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const suspendedUsers = await User.countDocuments({ isActive: false });

    // Users by plan
    const usersByPlan = await User.aggregate([
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 }
        }
      }
    ]);

    // Users by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // New users (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    return res.status(200).json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
        newInLast30Days: newUsers,
        byPlan: usersByPlan,
        byRole: usersByRole
      }
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user analytics'
    });
  }
});

/**
 * GET /api/admin/analytics/storage
 * Get storage statistics
 */
router.get('/analytics/storage', async (req, res) => {
  try {
    const users = await User.find().select('storageUsed storageLimit plan').lean();

    let totalStorage = 0;
    let totalUsed = 0;
    const storageByPlan = {};

    users.forEach(user => {
      totalStorage += user.storageLimit;
      totalUsed += user.storageUsed;

      if (!storageByPlan[user.plan]) {
        storageByPlan[user.plan] = {
          count: 0,
          used: 0,
          limit: 0
        };
      }
      storageByPlan[user.plan].count++;
      storageByPlan[user.plan].used += user.storageUsed;
      storageByPlan[user.plan].limit += user.storageLimit;
    });

    // Top storage users
    const topUsers = await User.find()
      .select('username email storageUsed storageLimit plan')
      .sort({ storageUsed: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        total: {
          limit: totalStorage,
          used: totalUsed,
          available: totalStorage - totalUsed,
          percentageUsed: Math.round((totalUsed / totalStorage) * 100)
        },
        byPlan: storageByPlan,
        topUsers
      }
    });
  } catch (error) {
    console.error('Get storage analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch storage analytics'
    });
  }
});

/**
 * GET /api/admin/analytics/activity
 * Get system activity statistics
 */
router.get('/analytics/activity', async (req, res) => {
  try {
    const repositories = await Repository.countDocuments();
    const timelineNodes = await TimelineNode.countDocuments();

    // Activity in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentNodes = await TimelineNode.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    const recentRepos = await Repository.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    const recentUsers = await User.countDocuments({
      lastLogin: { $gte: sevenDaysAgo }
    });

    return res.status(200).json({
      success: true,
      data: {
        repositories,
        timelineNodes,
        lastSevenDays: {
          newRepositories: recentRepos,
          newTimelineNodes: recentNodes,
          activeUsers: recentUsers
        }
      }
    });
  } catch (error) {
    console.error('Get activity analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity analytics'
    });
  }
});

// ============================================
// AUDIT LOG ENDPOINTS
// ============================================

/**
 * GET /api/admin/audit-logs
 * Get audit logs with filtering
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const { action, adminId, targetUser, page = 1, limit = 50 } = req.query;

    let query = {};

    if (action) query.action = action;
    if (adminId) query.adminId = adminId;
    if (targetUser) query.targetUser = targetUser;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit) || 50);
    const skip = (pageNum - 1) * limitNum;

    const total = await AuditLog.countDocuments(query);

    const logs = await AuditLog.find(query)
      .populate('adminId', 'username email')
      .populate('targetUser', 'username email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs'
    });
  }
});

// ============================================
// SYSTEM ENDPOINTS
// ============================================

/**
 * GET /api/admin/system/health
 * Get system health status
 */
router.get('/system/health', async (req, res) => {
  try {
    const dbConnected = true; // MongoDB connection is checked during startup
    const userCount = await User.countDocuments();
    const repoCount = await Repository.countDocuments();
    const nodeCount = await TimelineNode.countDocuments();

    return res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        database: {
          connected: dbConnected,
          users: userCount,
          repositories: repoCount,
          timelineNodes: nodeCount
        },
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({
      success: false,
      error: 'System health check failed',
      data: {
        status: 'unhealthy',
        timestamp: new Date()
      }
    });
  }
});

/**
 * GET /api/admin/system/stats
 * Get comprehensive system statistics
 */
router.get('/system/stats', async (req, res) => {
  try {
    const stats = {
      users: await User.countDocuments(),
      repositories: await Repository.countDocuments(),
      timelineNodes: await TimelineNode.countDocuments(),
      auditLogs: await AuditLog.countDocuments(),
      plans: await Plan.countDocuments()
    };

    return res.status(200).json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('System stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system stats'
    });
  }
});

module.exports = router;
