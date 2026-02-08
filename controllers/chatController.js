const Message = require("../models/Message")
const User = require("../models/User")

/**
 * @desc    Get recent chat messages
 * @route   GET /api/chat/messages
 * @access  Private (elderly only)
 * @query   since - ISO timestamp to fetch only newer messages (for polling)
 */
exports.getMessages = async (req, res) => {
  try {
    const { since } = req.query

    let query = {}
    if (since) {
      query.createdAt = { $gt: new Date(since) }
    }

    const messages = await Message.find(query)
      .populate("sender", "name")
      .sort({ createdAt: 1 })
      .limit(100)

    res.status(200).json({
      success: true,
      count: messages.length,
      data: {
        messages: messages.map((msg) => ({
          _id: msg._id,
          text: msg.text,
          senderId: msg.sender._id,
          senderName: msg.sender.name,
          createdAt: msg.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error("Error fetching messages:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching messages",
    })
  }
}

/**
 * @desc    Send a chat message
 * @route   POST /api/chat/messages
 * @access  Private (elderly only)
 */
exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message text is required",
      })
    }

    const message = await Message.create({
      sender: req.user._id,
      text: text.trim(),
    })

    await message.populate("sender", "name")

    res.status(201).json({
      success: true,
      data: {
        message: {
          _id: message._id,
          text: message.text,
          senderId: message.sender._id,
          senderName: message.sender.name,
          createdAt: message.createdAt,
        },
      },
    })
  } catch (error) {
    console.error("Error sending message:", error)
    res.status(500).json({
      success: false,
      message: "Server error while sending message",
    })
  }
}

/**
 * @desc    Get count of online elderly users (active in last 5 minutes)
 * @route   GET /api/chat/online-count
 * @access  Private (elderly only)
 */
exports.getOnlineCount = async (req, res) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const count = await User.countDocuments({
      role: "elderly",
      isActive: true,
      lastActive: { $gte: fiveMinutesAgo },
    })

    res.status(200).json({
      success: true,
      data: { onlineCount: count },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}
