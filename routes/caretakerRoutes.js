const express = require('express');
const router = express.Router();
const {
  getCaretakerDashboard,
  getElderlyUsers
} = require('../controllers/caretakerController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and caretaker role
router.use(protect);
router.use(authorize('caretaker'));

// Caretaker dashboard - get caretaker info and their elderly users
router.get('/dashboard', getCaretakerDashboard);

// Get list of elderly users assigned to this caretaker
router.get('/elderly-users', getElderlyUsers);

module.exports = router;
