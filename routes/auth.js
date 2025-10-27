const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🟢 Login attempt:', email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log('🔴 No user found for', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    console.log('🟠 Password match result:', isMatch);

    if (!isMatch) {
      console.log('🔴 Invalid password for', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    console.log('🟢 Token generated for:', email);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('❌ Login Error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
