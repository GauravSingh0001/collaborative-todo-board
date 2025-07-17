// routes/activities.js
const express = require('express');
const router = express.Router();
const Action = require('../models/Action');
const auth = require('../middleware/auth');

// GET /api/activities - Get all activities/actions
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, taskId } = req.query;
    
    const filter = {};
    if (taskId) {
      filter.task = taskId;
    }
    
    const actions = await Action.find(filter)
      .populate('user', 'name email')
      .populate('task', 'title')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Action.countDocuments(filter);
    
    res.json({
      actions,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// GET /api/activities/recent - Get recent activities
router.get('/recent', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const recentActions = await Action.find()
      .populate('user', 'name email')
      .populate('task', 'title')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json(recentActions);
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
});

// GET /api/activities/user/:userId - Get activities by user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const actions = await Action.find({ user: req.params.userId })
      .populate('user', 'name email')
      .populate('task', 'title')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Action.countDocuments({ user: req.params.userId });
    
    res.json({
      actions,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({ error: 'Failed to fetch user activities' });
  }
});

// POST /api/activities - Create new activity/action
router.post('/', auth, async (req, res) => {
  try {
    const { action, details, task } = req.body;
    
    const newAction = new Action({
      user: req.user.userId,
      action,
      details,
      task
    });
    
    await newAction.save();
    await newAction.populate('user', 'name email');
    await newAction.populate('task', 'title');
    
    res.status(201).json(newAction);
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

// DELETE /api/activities/:id - Delete activity (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const action = await Action.findById(req.params.id);
    
    if (!action) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    // Only allow users to delete their own actions
    if (action.user.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await Action.findByIdAndDelete(req.params.id);
    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

module.exports = router;