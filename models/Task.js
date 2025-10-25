const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending',
  },
  files: [{
    filename: String,
    path: String,
    uploadDate: {
      type: Date,
      default: Date.now,
    }
  }],
  completionFiles: [{
    filename: String,
    path: String,
    uploadDate: {
      type: Date,
      default: Date.now,
    }
  }],
  completedAt: {
    type: Date,
  },
  assignedDate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Task', taskSchema);