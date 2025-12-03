const express = require('express');
const router = express.Router();
const {
  registerCaretaker,
  registerElderly,
  login,
  getMe
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register-caretaker', registerCaretaker);
router.post('/register-elderly', registerElderly);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
