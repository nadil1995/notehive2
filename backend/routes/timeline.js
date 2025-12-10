const express = require('express');
const TimelineNode = require('../models/TimelineNode');
const Repository = require('../models/Repository');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * GET /api/timeline/search
 * Search timeline nodes
 * (Must be defined before :nodeId route to avoid param matching)
 */
router.get('/search', async (req, res) => {
  try {
    const { q, repositoryId } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Get user's repositories
    let repositoryIds;
    if (repositoryId) {
      // Verify repository belongs to user
      const repository = await Repository.findOne({
        _id: repositoryId,
        userId: req.user.userId
      });

      if (!repository) {
        return res.status(404).json({
          success: false,
          error: 'Repository not found'
        });
      }

      repositoryIds = [repositoryId];
    } else {
      const userRepositories = await Repository.find(
        { userId: req.user.userId },
        '_id'
      ).lean();
      repositoryIds = userRepositories.map(r => r._id);
    }

    // Search in title and content
    const searchRegex = new RegExp(q.trim(), 'i');
    const timelineNodes = await TimelineNode.find({
      repositoryId: { $in: repositoryIds },
      $or: [
        { title: searchRegex },
        { content: searchRegex },
        { tags: searchRegex }
      ]
    })
      .sort({ date: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: timelineNodes,
      count: timelineNodes.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search timeline nodes'
    });
  }
});

/**
 * POST /api/timeline
 * Create a new timeline node
 */
router.post('/', async (req, res) => {
  try {
    const { repositoryId, title, date, content, tags, color } = req.body;

    // Validate input
    if (!repositoryId || !title || !date) {
      return res.status(400).json({
        success: false,
        error: 'Repository ID, title, and date are required'
      });
    }

    // Verify repository belongs to user
    const repository = await Repository.findOne({
      _id: repositoryId,
      userId: req.user.userId
    });

    if (!repository) {
      return res.status(404).json({
        success: false,
        error: 'Repository not found'
      });
    }

    // Create timeline node
    const timelineNode = new TimelineNode({
      repositoryId,
      title: title.trim(),
      date: new Date(date),
      content: content?.trim() || '',
      tags: Array.isArray(tags) ? tags.filter(t => t).map(t => t.trim()) : [],
      color: color || '#FFFFFF',
      attachments: []
    });

    await timelineNode.save();

    return res.status(201).json({
      success: true,
      message: 'Timeline node created successfully',
      data: timelineNode
    });
  } catch (error) {
    console.error('Create timeline node error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create timeline node'
    });
  }
});

/**
 * GET /api/timeline
 * Get all timeline nodes for user's repositories
 */
router.get('/', async (req, res) => {
  try {
    const { repositoryId, tags, startDate, endDate, sort = 'date' } = req.query;

    // Get user's repositories
    const userRepositories = await Repository.find(
      { userId: req.user.userId },
      '_id'
    ).lean();

    const repositoryIds = userRepositories.map(r => r._id);

    // Build query
    let query = { repositoryId: { $in: repositoryIds } };

    // Filter by specific repository if provided
    if (repositoryId) {
      query.repositoryId = repositoryId;
    }

    // Filter by tags if provided
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      query.tags = { $in: tagArray };
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Build sort
    const sortField = sort === 'created' ? 'createdAt' : 'date';
    const sortOrder = -1; // Most recent first

    const timelineNodes = await TimelineNode.find(query)
      .sort({ [sortField]: sortOrder })
      .lean();

    return res.status(200).json({
      success: true,
      data: timelineNodes,
      count: timelineNodes.length
    });
  } catch (error) {
    console.error('Get timeline nodes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch timeline nodes'
    });
  }
});

/**
 * GET /api/timeline/:nodeId
 * Get specific timeline node
 */
router.get('/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;

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

    return res.status(200).json({
      success: true,
      data: timelineNode
    });
  } catch (error) {
    console.error('Get timeline node error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch timeline node'
    });
  }
});

/**
 * PUT /api/timeline/:nodeId
 * Update timeline node
 */
router.put('/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { title, date, content, tags, color } = req.body;

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

    // Update fields
    if (title) timelineNode.title = title.trim();
    if (date) timelineNode.date = new Date(date);
    if (content !== undefined) timelineNode.content = content.trim();
    if (tags) timelineNode.tags = Array.isArray(tags) ? tags.filter(t => t).map(t => t.trim()) : [];
    if (color) timelineNode.color = color;
    timelineNode.updatedAt = new Date();

    await timelineNode.save();

    return res.status(200).json({
      success: true,
      message: 'Timeline node updated successfully',
      data: timelineNode
    });
  } catch (error) {
    console.error('Update timeline node error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update timeline node'
    });
  }
});

/**
 * DELETE /api/timeline/:nodeId
 * Delete timeline node
 */
router.delete('/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;

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

    await TimelineNode.findByIdAndDelete(nodeId);

    return res.status(200).json({
      success: true,
      message: 'Timeline node deleted successfully'
    });
  } catch (error) {
    console.error('Delete timeline node error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete timeline node'
    });
  }
});

/**
 * GET /api/timeline/:nodeId/attachments
 * Get attachments for a timeline node
 */
router.get('/:nodeId/attachments', async (req, res) => {
  try {
    const { nodeId } = req.params;

    const timelineNode = await TimelineNode.findById(nodeId, 'attachments');

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

    return res.status(200).json({
      success: true,
      data: timelineNode.attachments || [],
      count: (timelineNode.attachments || []).length
    });
  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attachments'
    });
  }
});

/**
 * POST /api/timeline/:nodeId/attachments
 * Add attachment to timeline node
 */
router.post('/:nodeId/attachments', async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { filename, fileType, fileSize, s3Key, fileUrl } = req.body;

    if (!filename || !fileType || !s3Key || !fileUrl) {
      return res.status(400).json({
        success: false,
        error: 'filename, fileType, s3Key, and fileUrl are required'
      });
    }

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

    // Add attachment
    timelineNode.attachments = timelineNode.attachments || [];
    timelineNode.attachments.push({
      filename: filename.trim(),
      fileType,
      fileSize: fileSize || 0,
      s3Key: s3Key.trim(),
      fileUrl: fileUrl.trim(),
      uploadedAt: new Date()
    });

    timelineNode.updatedAt = new Date();
    await timelineNode.save();

    return res.status(201).json({
      success: true,
      message: 'Attachment added successfully',
      data: timelineNode
    });
  } catch (error) {
    console.error('Add attachment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add attachment'
    });
  }
});

/**
 * DELETE /api/timeline/:nodeId/attachments/:attachmentId
 * Remove attachment from timeline node
 */
router.delete('/:nodeId/attachments/:attachmentId', async (req, res) => {
  try {
    const { nodeId, attachmentId } = req.params;

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

    // Remove attachment
    timelineNode.attachments = timelineNode.attachments.filter(
      a => a._id.toString() !== attachmentId
    );

    timelineNode.updatedAt = new Date();
    await timelineNode.save();

    return res.status(200).json({
      success: true,
      message: 'Attachment removed successfully',
      data: timelineNode
    });
  } catch (error) {
    console.error('Remove attachment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove attachment'
    });
  }
});

module.exports = router;
