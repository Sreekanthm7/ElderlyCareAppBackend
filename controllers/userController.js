const User = require('../models/User');

/**
 * @desc    Get all elderly users assigned to a specific caretaker
 * @route   GET /api/users/elderly-by-caretaker/:caretakerId
 * @access  Private (Caretaker only)
 */
exports.getElderlyByCaretaker = async (req, res) => {
  try {
    const { caretakerId } = req.params;

    // Validate that caretaker exists
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
        message: 'Provided ID is not a caretaker'
      });
    }

    // Find all elderly users assigned to this caretaker
    const elderlyUsers = await User.find({
      role: 'elderly',
      caretakerId: caretakerId,
      isActive: true
    })
      .select('-password')
      .populate('caretakerId', 'name email phone specialization experience')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: elderlyUsers.length,
      data: {
        caretaker: {
          id: caretaker._id,
          name: caretaker.name,
          email: caretaker.email,
          specialization: caretaker.specialization
        },
        elderlyUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching elderly users',
      error: error.message
    });
  }
};

/**
 * @desc    Get all caretakers
 * @route   GET /api/users/caretakers
 * @access  Public (or can be protected based on requirements)
 */
exports.getAllCaretakers = async (req, res) => {
  try {
    const caretakers = await User.find({
      role: 'caretaker',
      isActive: true
    })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: caretakers.length,
      data: {
        caretakers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching caretakers',
      error: error.message
    });
  }
};

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Populate caretaker info if user is elderly
    if (user.role === 'elderly') {
      await user.populate('caretakerId', 'name email phone specialization experience');
    }

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user',
      error: error.message
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/:id
 * @access  Private
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Fields that can be updated (excluding password, email, role)
    const allowedUpdates = [
      'name',
      'phone',
      'age',
      'address',
      'medicalConditions',
      'emergencyContact',
      'specialization',
      'experience',
      'certification',
      'availability',
      'profilePicture'
    ];

    // Filter out fields that shouldn't be updated
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // If trying to update caretakerId for elderly user, validate it
    if (req.body.caretakerId && user.role === 'elderly') {
      const caretaker = await User.findById(req.body.caretakerId);

      if (!caretaker || caretaker.role !== 'caretaker') {
        return res.status(400).json({
          success: false,
          message: 'Invalid caretaker assignment'
        });
      }

      updates.caretakerId = req.body.caretakerId;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updates,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    // Populate caretaker info if user is elderly
    if (updatedUser.role === 'elderly') {
      await updatedUser.populate('caretakerId', 'name email phone specialization experience');
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: updatedUser
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
      message: 'Server error while updating user',
      error: error.message
    });
  }
};

/**
 * @desc    Delete/Deactivate user
 * @route   DELETE /api/users/:id
 * @access  Private (Admin or Self)
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete by setting isActive to false
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user',
      error: error.message
    });
  }
};

/**
 * @desc    Get statistics for a caretaker (total elderly, active cases, etc.)
 * @route   GET /api/users/caretaker-stats/:caretakerId
 * @access  Private
 */
exports.getCaretakerStats = async (req, res) => {
  try {
    const { caretakerId } = req.params;

    const caretaker = await User.findById(caretakerId);

    if (!caretaker || caretaker.role !== 'caretaker') {
      return res.status(404).json({
        success: false,
        message: 'Caretaker not found'
      });
    }

    const totalElderly = await User.countDocuments({
      role: 'elderly',
      caretakerId: caretakerId,
      isActive: true
    });

    const elderlyUsers = await User.find({
      role: 'elderly',
      caretakerId: caretakerId,
      isActive: true
    }).select('name age medicalConditions createdAt');

    res.status(200).json({
      success: true,
      data: {
        caretaker: {
          id: caretaker._id,
          name: caretaker.name,
          specialization: caretaker.specialization,
          experience: caretaker.experience
        },
        statistics: {
          totalElderlyAssigned: totalElderly,
          elderlyDetails: elderlyUsers
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics',
      error: error.message
    });
  }
};
