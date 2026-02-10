const Notification = require("../models/Notification")

/**
 * @desc    Get notifications for the logged-in caretaker
 * @route   GET /api/notifications
 * @access  Private (caretaker only)
 */
exports.getNotifications = async (req, res) => {
  try {
    const caretakerId = req.user._id

    const notifications = await Notification.find({ caretakerId })
      .populate("elderlyUserId", "name age")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    const unreadCount = await Notification.countDocuments({
      caretakerId,
      isRead: false,
    })

    res.status(200).json({
      success: true,
      data: {
        notifications: notifications.map((n) => ({
          id: n._id,
          type: n.type,
          elderlyUser: n.elderlyUserId
            ? { id: n.elderlyUserId._id, name: n.elderlyUserId.name, age: n.elderlyUserId.age }
            : null,
          detectedMood: n.detectedMood,
          riskLevel: n.riskLevel,
          message: n.message,
          emotionsDetected: n.emotionsDetected,
          isRead: n.isRead,
          createdAt: n.createdAt,
        })),
        unreadCount,
      },
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching notifications",
    })
  }
}

/**
 * @desc    Mark a notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private (caretaker only)
 */
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, caretakerId: req.user._id },
      { isRead: true },
      { new: true }
    )

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      })
    }

    res.status(200).json({
      success: true,
      data: { id: notification._id, isRead: true },
    })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

/**
 * @desc    Mark all notifications as read for the logged-in caretaker
 * @route   PUT /api/notifications/read-all
 * @access  Private (caretaker only)
 */
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { caretakerId: req.user._id, isRead: false },
      { isRead: true }
    )

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    })
  } catch (error) {
    console.error("Error marking all as read:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}
