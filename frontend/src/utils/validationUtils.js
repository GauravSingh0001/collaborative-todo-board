// utils/validationUtils.js
const Task = require('../models/Task');

const FORBIDDEN_TITLES = ['Todo', 'In Progress', 'Done', 'todo', 'in progress', 'done'];

const validateTaskTitle = async (title, excludeTaskId = null) => {
  if (!title || !title.trim()) {
    return { isValid: false, error: 'Title is required' };
  }

  const trimmedTitle = title.trim();

  // Check forbidden titles
  if (FORBIDDEN_TITLES.includes(trimmedTitle)) {
    return { isValid: false, error: 'Task title cannot match column names' };
  }

  // Check uniqueness
  const query = { 
    title: { $regex: new RegExp(`^${trimmedTitle}$`, 'i') }
  };
  
  if (excludeTaskId) {
    query._id = { $ne: excludeTaskId };
  }

  const existingTask = await Task.findOne(query);
  if (existingTask) {
    return { isValid: false, error: 'Task title must be unique' };
  }

  return { isValid: true };
};

const validateTaskData = (data) => {
  const errors = {};

  if (!data.title || !data.title.trim()) {
    errors.title = 'Title is required';
  }

  if (data.priority && !['Low', 'Medium', 'High'].includes(data.priority)) {
    errors.priority = 'Priority must be Low, Medium, or High';
  }

  if (data.status && !['Todo', 'In Progress', 'Done'].includes(data.status)) {
    errors.status = 'Status must be Todo, In Progress, or Done';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  validateTaskTitle,
  validateTaskData,
  FORBIDDEN_TITLES
};