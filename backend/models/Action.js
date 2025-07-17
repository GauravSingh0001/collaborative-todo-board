// models/Action.js
const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'task_created',
      'task_updated',
      'task_deleted',
      'task_assigned',
      'task_moved',
      'task_status_changed',
      'task_priority_changed',
      'user_logged_in',
      'user_logged_out',
      'conflict_resolved',
      'smart_assign_triggered'
    ]
  },
  details: {
    type: String,
    required: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: false // Some actions might not be task-specific
  },
  metadata: {
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    field: String,
    additionalInfo: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient querying
actionSchema.index({ user: 1, createdAt: -1 });
actionSchema.index({ task: 1, createdAt: -1 });
actionSchema.index({ action: 1, createdAt: -1 });
actionSchema.index({ createdAt: -1 });

// Static method to log actions
actionSchema.statics.logAction = async function(userId, action, details, taskId = null, metadata = {}) {
  try {
    const actionDoc = new this({
      user: userId,
      action,
      details,
      task: taskId,
      metadata
    });
    
    await actionDoc.save();
    await actionDoc.populate('user', 'name email');
    if (taskId) {
      await actionDoc.populate('task', 'title');
    }
    
    return actionDoc;
  } catch (error) {
    console.error('Error logging action:', error);
    throw error;
  }
};

module.exports = mongoose.model('Action', actionSchema);