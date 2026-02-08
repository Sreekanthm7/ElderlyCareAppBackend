const express = require("express")
const router = express.Router()
const {
  getMessages,
  sendMessage,
  getOnlineCount,
} = require("../controllers/chatController")
const { protect, authorize } = require("../middleware/auth")

// All chat routes are protected and elderly-only
router.get("/messages", protect, authorize("elderly"), getMessages)
router.post("/messages", protect, authorize("elderly"), sendMessage)
router.get("/online-count", protect, authorize("elderly"), getOnlineCount)

module.exports = router
