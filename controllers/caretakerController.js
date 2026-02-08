const User = require('../models/User');

/**
 * @desc    Get caretaker dashboard with assigned elderly users
 * @route   GET /api/caretaker/dashboard
 * @access  Private (Caretaker only)
 */
exports.getCaretakerDashboard = async (req, res) => {
  try {
    // req.user is set by the protect middleware (from JWT token)
    const caretakerId = req.user.id;
    console.log('Dashboard request for caretaker ID:', caretakerId);

    // Get caretaker info
    const caretaker = await User.findById(caretakerId).select('-password');

    if (!caretaker || caretaker.role !== 'caretaker') {
      console.log('Access denied - not a caretaker');
      return res.status(403).json({
        success: false,
        message: 'Access denied. Caretaker access required.'
      });
    }

    console.log('Caretaker found:', caretaker.name);

    // Find all elderly users assigned to this caretaker
    const elderlyUsers = await User.find({
      role: 'elderly',
      caretakerId: caretakerId,
      isActive: true
    })
      .select('-password')
      .sort({ createdAt: -1 });

    console.log(`Found ${elderlyUsers.length} elderly users assigned to this caretaker`);

    // Format the response to match frontend expectations
    const formattedElderlyUsers = elderlyUsers.map(user => ({
      id: user._id.toString(),
      name: user.name,
      age: user.age,
      email: user.email,
      phone: user.phone,
      address: user.address,
      healthStatus: user.healthStatus || 'good',
      currentMood: user.currentMood || 'neutral',
      lastActive: getLastActiveString(user.lastActive),
      medicalConditions: user.medicalConditions || [],
      emergencyContact: user.emergencyContact,
      profileImage: user.profilePicture
    }));

    res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        id: caretaker._id.toString(),
        name: caretaker.name,
        email: caretaker.email,
        phone: caretaker.phone,
        experience: caretaker.experience,
        specialization: caretaker.specialization,
        elderlyUsers: formattedElderlyUsers
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data',
      error: error.message
    });
  }
};

/**
 * @desc    Get list of elderly users assigned to caretaker
 * @route   GET /api/caretaker/elderly-users
 * @access  Private (Caretaker only)
 */
exports.getElderlyUsers = async (req, res) => {
  try {
    const caretakerId = req.user.id;

    const elderlyUsers = await User.find({
      role: 'elderly',
      caretakerId: caretakerId,
      isActive: true
    })
      .select('-password')
      .sort({ createdAt: -1 });

    const formattedElderlyUsers = elderlyUsers.map(user => ({
      id: user._id.toString(),
      name: user.name,
      age: user.age,
      email: user.email,
      phone: user.phone,
      address: user.address,
      healthStatus: user.healthStatus || 'good',
      currentMood: user.currentMood || 'neutral',
      lastActive: getLastActiveString(user.lastActive),
      medicalConditions: user.medicalConditions || [],
      emergencyContact: user.emergencyContact
    }));

    res.status(200).json({
      success: true,
      data: formattedElderlyUsers
    });
  } catch (error) {
    console.error('Fetch elderly users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching elderly users',
      error: error.message
    });
  }
};

// Helper function to format last active time
function getLastActiveString(lastActiveDate) {
  if (!lastActiveDate) {
    return 'Never';
  }

  const now = new Date();
  const lastActive = new Date(lastActiveDate);
  const diffInMs = now - lastActive;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else {
    return lastActive.toLocaleDateString();
  }
}
