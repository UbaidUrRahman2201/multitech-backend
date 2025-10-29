const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');
const Message = require('../models/Message');
const { protect, adminOnly } = require('../middleware/auth');

// Get all employees
router.get('/employees', protect, adminOnly, async (req, res) => {
  try {
    const employees = await User.find({ role: 'Employee' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get dashboard statistics
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ role: 'Employee' });
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const pendingTasks = await Task.countDocuments({ status: 'pending' });
    const totalMessages = await Message.countDocuments();

    res.json({
      totalEmployees,
      totalTasks,
      completedTasks,
      pendingTasks,
      totalMessages,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create employee or admin
router.post('/employees', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role } = req.body; // 👈 role include kiya

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // ✅ Save role from request (default: Employee)
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Employee', // 👈 agar frontend se na aye to Employee
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Delete employee
router.delete('/employees/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'Admin') {
      return res.status(400).json({ message: 'Cannot delete admin user' });
    }

    // Delete all tasks and messages related to this employee
    await Task.deleteMany({ assignedTo: req.params.id });
    await Message.deleteMany({
      $or: [{ sender: req.params.id }, { receiver: req.params.id }]
    });

    await user.deleteOne();
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
