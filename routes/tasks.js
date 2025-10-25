const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Task = require('../models/Task');
const { protect, adminOnly } = require('../middleware/auth');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Create Task (Admin only)
router.post('/', protect, adminOnly, upload.array('files', 5), async (req, res) => {
  try {
    const { title, description, assignedTo } = req.body;

    const files = req.files ? req.files.map(file => ({
      filename: file.originalname,
      path: file.path,
    })) : [];

    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      files,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    // Emit socket event to employee
    const io = req.app.get('io');
    io.to(assignedTo).emit('newTask', populatedTask);

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Tasks (Employee sees only their tasks, Admin sees all)
router.get('/', protect, async (req, res) => {
  try {
    let tasks;
    
    if (req.user.role === 'Admin') {
      tasks = await Task.find()
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email')
        .sort({ createdAt: -1 });
    } else {
      tasks = await Task.find({ assignedTo: req.user._id })
        .populate('assignedBy', 'name email')
        .sort({ createdAt: -1 });
    }

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Task Status
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Employees can only update their own tasks
    if (req.user.role !== 'Admin' && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    task.status = status;
    if (status === 'completed') {
      task.completedAt = Date.now();
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    // Notify admin
    const io = req.app.get('io');
    io.to(task.assignedBy.toString()).emit('taskUpdated', populatedTask);

    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload completion files
router.post('/:id/complete', protect, upload.array('files', 5), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const completionFiles = req.files ? req.files.map(file => ({
      filename: file.originalname,
      path: file.path,
    })) : [];

    task.completionFiles = [...task.completionFiles, ...completionFiles];
    task.status = 'completed';
    task.completedAt = Date.now();

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    // Notify admin
    const io = req.app.get('io');
    io.to(task.assignedBy.toString()).emit('taskCompleted', populatedTask);

    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Task (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Delete associated files
    [...task.files, ...task.completionFiles].forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });

    await task.deleteOne();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;