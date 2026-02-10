const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema(
  {
    // The caretaker who receives this notification
    caretakerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Caretaker ID is required"],
    },

    // The elderly user this notification is about
    elderlyUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Elderly user ID is required"],
    },

    // Notification type
    type: {
      type: String,
      enum: ["mood_alert", "health_alert", "general"],
      default: "mood_alert",
    },

    // Mood detected
    detectedMood: {
      type: String,
      enum: ["Normal", "Stressed", "Depressed", "Highly Depressed", "Unknown"],
      required: true,
    },

    // Risk level
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },

    // Human-readable message
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },

    // Emotions detected during analysis
    emotionsDetected: {
      type: [String],
      default: [],
    },

    // Whether the caretaker has read this notification
    isRead: {
      type: Boolean,
      default: false,
    },

    // Reference to the mood entry that triggered this
    moodEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MoodEntry",
    },
  },
  {
    timestamps: true,
  }
)

// Index for efficient caretaker queries
notificationSchema.index({ caretakerId: 1, createdAt: -1 })
notificationSchema.index({ caretakerId: 1, isRead: 1 })

const Notification = mongoose.model("Notification", notificationSchema)

module.exports = Notification
