const express = require('express');
const Action = require('../models/Action');
const auth = require('../middleware/auth');

const router = express.Router();

// Get last 20 actions
router.get('/', auth, async (req, res) => {
  try {
    const actions = await Action.find()
      .populate('userId', 'username email')
      .sort({ timestamp: -1 })
      .limit(20);

    res.json(actions);
  } catch (error) {
    console.error('Get actions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get actions for a specific task
router.get('/task/:taskId', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const actions = await Action.find({ taskId })
      .populate('userId', 'username email')
      .sort({ timestamp: -1 })
      .limit(10);

    res.json(actions);
  } catch (error) {
    console.error('Get task actions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get actions by user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const actions = await Action.find({ userId })
      .populate('userId', 'username email')
      .sort({ timestamp: -1 })
      .limit(20);

    res.json(actions);
  } catch (error) {
    console.error('Get user actions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;