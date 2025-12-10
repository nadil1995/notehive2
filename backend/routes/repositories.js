const express = require('express');
const Repository = require('../models/Repository');
const TimelineNode = require('../models/TimelineNode');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * POST /api/repositories
 * Create a new repository
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, color } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Repository name is required'
      });
    }

    // Create repository
    const repository = new Repository({
      userId: req.user.userId,
      name: name.trim(),
      description: description?.trim() || '',
      color: color || '#3B82F6',
      isArchived: false
    });

    await repository.save();

    return res.status(201).json({
      success: true,
      message: 'Repository created successfully',
      data: repository
    });
  } catch (error) {
    console.error('Create repository error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create repository'
    });
  }
});

/**
 * GET /api/repositories
 * Get all repositories for current user
 */
router.get('/', async (req, res) => {
  try {
    const { archived } = req.query;

    let query = { userId: req.user.userId };

    // Filter by archive status if specified
    if (archived === 'true') {
      query.isArchived = true;
    } else if (archived === 'false') {
      query.isArchived = false;
    }

    const repositories = await Repository.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: repositories,
      count: repositories.length
    });
  } catch (error) {
    console.error('Get repositories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch repositories'
    });
  }
});

/**
 * GET /api/repositories/:repositoryId
 * Get specific repository with timeline nodes count
 */
router.get('/:repositoryId', async (req, res) => {
  try {
    const { repositoryId } = req.params;

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

    // Count timeline nodes in this repository
    const nodeCount = await TimelineNode.countDocuments({
      repositoryId: repositoryId
    });

    const repositoryData = repository.toObject();
    repositoryData.nodeCount = nodeCount;

    return res.status(200).json({
      success: true,
      data: repositoryData
    });
  } catch (error) {
    console.error('Get repository error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch repository'
    });
  }
});

/**
 * PUT /api/repositories/:repositoryId
 * Update repository
 */
router.put('/:repositoryId', async (req, res) => {
  try {
    const { repositoryId } = req.params;
    const { name, description, color } = req.body;

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

    // Update fields
    if (name) repository.name = name.trim();
    if (description !== undefined) repository.description = description.trim();
    if (color) repository.color = color;
    repository.updatedAt = new Date();

    await repository.save();

    return res.status(200).json({
      success: true,
      message: 'Repository updated successfully',
      data: repository
    });
  } catch (error) {
    console.error('Update repository error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update repository'
    });
  }
});

/**
 * DELETE /api/repositories/:repositoryId
 * Delete (soft delete via archive) a repository
 */
router.delete('/:repositoryId', async (req, res) => {
  try {
    const { repositoryId } = req.params;
    const { permanent } = req.query;

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

    // Soft delete (archive) by default, hard delete if permanent=true
    if (permanent === 'true') {
      // Hard delete: delete all timeline nodes first
      await TimelineNode.deleteMany({ repositoryId: repositoryId });
      await Repository.findByIdAndDelete(repositoryId);

      return res.status(200).json({
        success: true,
        message: 'Repository permanently deleted'
      });
    } else {
      // Soft delete: archive the repository
      repository.isArchived = true;
      repository.updatedAt = new Date();
      await repository.save();

      return res.status(200).json({
        success: true,
        message: 'Repository archived successfully',
        data: repository
      });
    }
  } catch (error) {
    console.error('Delete repository error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete repository'
    });
  }
});

/**
 * POST /api/repositories/:repositoryId/restore
 * Restore archived repository
 */
router.post('/:repositoryId/restore', async (req, res) => {
  try {
    const { repositoryId } = req.params;

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

    repository.isArchived = false;
    repository.updatedAt = new Date();
    await repository.save();

    return res.status(200).json({
      success: true,
      message: 'Repository restored successfully',
      data: repository
    });
  } catch (error) {
    console.error('Restore repository error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restore repository'
    });
  }
});

/**
 * GET /api/repositories/:repositoryId/timeline
 * Get all timeline nodes for a repository
 */
router.get('/:repositoryId/timeline', async (req, res) => {
  try {
    const { repositoryId } = req.params;
    const { sort = 'date', order = 'desc', tags } = req.query;

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

    // Build query
    let query = { repositoryId: repositoryId };

    // Filter by tags if specified
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      query.tags = { $in: tagArray };
    }

    // Build sort
    const sortField = sort === 'date' ? 'date' : 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;

    const timelineNodes = await TimelineNode.find(query)
      .sort({ [sortField]: sortOrder })
      .lean();

    return res.status(200).json({
      success: true,
      data: timelineNodes,
      count: timelineNodes.length
    });
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch timeline'
    });
  }
});

module.exports = router;
