// models/Action.js
const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['create', 'update', 'delete', 'assign', 'move', 'smart_assign'],
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  details: {
    type: Object,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

actionSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Action', actionSchema);