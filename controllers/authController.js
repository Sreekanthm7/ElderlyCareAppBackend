const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

/**
 * @desc    Register a new caretaker
 * @route   POST /api/auth/register-caretaker
 * @access  Public
 */
exports.registerCaretaker = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      experience
    } = req.body;

    // Check if caretaker already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create caretaker
    const caretaker = await User.create({
      name,
      email,
      phone,
      password,
      role: 'caretaker',
      experience
    });

    // Generate token
    const token = generateToken(caretaker._id);

    res.status(201).json({
      success: true,
      message: 'Caretaker registered successfully',
      data: {
        user: caretaker.toSafeObject(),
        token
      }
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during caretaker registration',
      error: error.message
    });
  }
};

/**
 * @desc    Register a new elderly user with caretaker assignment
 * @route   POST /api/auth/register-elderly
 * @access  Public (or can be protected based on requirements)
 */
exports.registerElderly = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      age,
      address,
      caretakerId
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate that caretaker exists and has correct role
    const caretaker = await User.findById(caretakerId);
    if (!caretaker) {
      return res.status(404).json({
        success: false,
        message: 'Caretaker not found'
      });
    }

    if (caretaker.role !== 'caretaker') {
      return res.status(400).json({
        success: false,
        message: 'Invalid caretaker. The assigned user is not a caretaker.'
      });
    }

    // Create elderly user
    const elderly = await User.create({
      name,
      email,
      phone,
      password,
      role: 'elderly',
      age,
      address,
      caretakerId
    });

    // Generate token
    const token = generateToken(elderly._id);

    // Populate caretaker details
    await elderly.populate('caretakerId', 'name email phone experience');

    res.status(201).json({
      success: true,
      message: 'Elderly user registered successfully',
      data: {
        user: elderly.toSafeObject(),
        token
      }
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during elderly user registration',
      error: error.message
    });
  }
};

/**
 * @desc    Login user (both elderly and caretaker)
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Compare password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Populate caretaker info if user is elderly
    if (user.role === 'elderly') {
      await user.populate('caretakerId', 'name email phone experience');
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toSafeObject(),
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Populate caretaker info if user is elderly
    if (user.role === 'elderly') {
      await user.populate('caretakerId', 'name email phone experience');
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
