const express = require("express")
const router = express.Router()
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController")
const { protect, authorize } = require("../middleware/auth")

// Get all notifications for logged-in caretaker
router.get("/", protect, authorize("caretaker"), getNotifications)

// Mark all notifications as read
router.put("/read-all", protect, authorize("caretaker"), markAllAsRead)

// Mark a single notification as read
router.put("/:id/read", protect, authorize("caretaker"), markAsRead)

module.exports = router
