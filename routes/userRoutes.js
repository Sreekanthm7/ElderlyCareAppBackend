const express = require('express');
const router = express.Router();
const {
  getElderlyByCaretaker,
  getAllCaretakers,
  getUserById,
  updateUser,
  deleteUser,
  getCaretakerStats
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Public routes (can be made protected based on requirements)
router.get('/caretakers', getAllCaretakers);

// Protected routes
router.get('/elderly-by-caretaker/:caretakerId', protect, getElderlyByCaretaker);
router.get('/caretaker-stats/:caretakerId', protect, authorize('caretaker'), getCaretakerStats);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, deleteUser);

module.exports = router;
