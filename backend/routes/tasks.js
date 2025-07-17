// routes/tasks.js
const express = require('express');
const router = express.Router();
const Task = require('../models/Task'); // Make sure you have this model
const auth = require('../middleware/auth'); // Authentication middleware
const mongoose = require('mongoose');
// Valid status values
const VALID_STATUSES = ['Todo', 'In Progress', 'Done'];

// REPLACE YOUR EXISTING validateTask FUNCTION WITH THIS IMPROVED ONE:
const validateTask = (req, res, next) => {
  const { title, description, status, assignedUser, priority, dueDate } = req.body;
  
  console.log('Validating task data:', req.body);
  
  const errors = [];
  
  // Check required fields
  if (!title || typeof title !== 'string' || title.trim() === '') {
    errors.push('Title is required and must be a non-empty string');
  }
  
  // Validate status
  if (status && !VALID_STATUSES.includes(status)) {
    errors.push(`Invalid status "${status}". Must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  
  // Validate priority if provided
  const validPriorities = ['Low', 'Medium', 'High'];
  if (priority && !validPriorities.includes(priority)) {
    errors.push(`Invalid priority "${priority}". Must be one of: ${validPriorities.join(', ')}`);
  }
  
  // Validate due date if provided
  if (dueDate && dueDate !== null && dueDate !== '' && isNaN(Date.parse(dueDate))) {
    errors.push(`Invalid due date format: "${dueDate}". Use ISO date format (YYYY-MM-DD)`);
  }
  
  // Validate assignedUser if provided
  const isValidObjectId = /^[a-f\d]{24}$/i.test(assignedUser);
if (assignedUser && !isValidObjectId) {
  errors.push('assignedUser must be a valid MongoDB ObjectId');
}

  
  // If there are validation errors, return them
  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed',
      errors: errors,
      received: req.body
    });
  }
  
  next();
};

// GET /api/tasks - Get all tasks
router.get('/', auth, async (req, res) => {
  try {
    console.log('Getting tasks for user:', req.user.userId);
    
    const tasks = await Task.find()
      .populate('assignedUser', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${tasks.length} tasks`);
    res.json(tasks);
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// GET /api/tasks/:id - Get single task
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedUser', 'name email')
      .populate('createdBy', 'name email');
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    console.log('Found task:', task._id);
    res.json(task);
  } catch (error) {
    console.error('Error getting task:', error);
    res.status(500).json({ error: 'Failed to get task' });
  }
});

// REPLACE YOUR EXISTING POST ROUTE WITH THIS IMPROVED ONE:
router.post('/', auth, validateTask, async (req, res) => {
  try {
    const { title, description, status, assignedUser, priority, dueDate } = req.body;
    
    console.log('Creating new task:', {
      title,
      status: status || 'Todo',
      assignedUser,
      priority,
      createdBy: req.user.userId
    });
    
    const task = new Task({
  title: title.trim(),
  description: description?.trim() || '',
  status: status || 'Todo',
  assignedUser: assignedUser ? new mongoose.Types.ObjectId(assignedUser) : null,
  priority: priority || 'Medium',
  dueDate: dueDate ? new Date(dueDate) : null,
  createdBy: req.user.userId,
  createdAt: new Date(),
  updatedAt: new Date()
});
    
    const savedTask = await task.save();
    
    // Populate the saved task
    const populatedTask = await Task.findById(savedTask._id)
      .populate('assignedUser', 'name email')
      .populate('createdBy', 'name email');
    
    console.log('Task created successfully:', populatedTask._id);
    
    // Emit to all connected clients
    req.io?.emit('taskCreated', populatedTask);
    
    res.status(201).json(populatedTask);
  } catch (error) {
    console.error('Error creating task:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Database validation error',
        details: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid data type',
        details: `Invalid ${error.path}: ${error.value}`
      });
    }
    
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', auth, validateTask, async (req, res) => {
  try {
    const { title, description, status, assignedUser, priority, dueDate } = req.body;
    
    console.log('Updating task:', req.params.id, 'with data:', req.body);
    
    const updateData = {
      title: title.trim(),
      description: description?.trim() || '',
      status: status || 'Todo',
      assignedUser: assignedUser || null,
      priority: priority || 'Medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      updatedAt: new Date()
    };
    
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('assignedUser', 'name email')
    .populate('createdBy', 'name email');
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    console.log('Task updated successfully:', task._id);
    
    // Emit to all connected clients
    req.io?.emit('taskUpdated', task);
    
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// PATCH /api/tasks/:id/status - Update task status only
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    console.log('Updating task status:', req.params.id, 'to:', status);
    
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        received: status,
        validStatuses: VALID_STATUSES
      });
    }
    
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
    .populate('assignedUser', 'name email')
    .populate('createdBy', 'name email');
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    console.log('Task status updated successfully:', task._id);
    
    // Emit to all connected clients
    req.io?.emit('taskStatusUpdated', { taskId: task._id, status, task });
    
    res.json(task);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('Deleting task:', req.params.id);
    
    const task = await Task.findByIdAndDelete(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    console.log('Task deleted successfully:', task._id);
    
    // Emit to all connected clients
    req.io?.emit('taskDeleted', { taskId: task._id });
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// GET /api/tasks/status/:status - Get tasks by status
router.get('/status/:status', auth, async (req, res) => {
  try {
    const { status } = req.params;
    
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        received: status,
        validStatuses: VALID_STATUSES
      });
    }
    
    const tasks = await Task.find({ status })
      .populate('assignedUser', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${tasks.length} tasks with status: ${status}`);
    res.json(tasks);
  } catch (error) {
    console.error('Error getting tasks by status:', error);
    res.status(500).json({ error: 'Failed to get tasks by status' });
  }
});

module.exports = router;