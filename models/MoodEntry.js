const mongoose = require("mongoose")

const responseSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "",
    },
  },
  { _id: false }
)

const moodEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    mood: {
      type: String,
      enum: ["happy", "sad", "neutral"],
      default: "neutral",
    },
    moodScore: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    emotions: {
      type: [String],
      default: [],
    },
    concerns: {
      type: [String],
      default: [],
    },

    // AI mood analysis fields
    detectedMood: {
      type: String,
      enum: ["Normal", "Stressed", "Depressed", "Highly Depressed", "Unknown"],
      default: null,
    },
    confidence: {
      type: String,
      enum: ["low", "medium", "high"],
      default: null,
    },
    emotionsDetected: {
      type: [String],
      default: [],
    },
    reason: {
      type: String,
      default: "",
      maxlength: 500,
    },
    analysisSource: {
      type: String,
      enum: ["ai", "fallback", null],
      default: null,
    },
    responses: {
      type: [responseSchema],
      default: [],
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

// Compound index for efficient queries by user and date
moodEntrySchema.index({ userId: 1, date: -1 })

// Ensure one entry per user per day
moodEntrySchema.index(
  { userId: 1, date: 1 },
  {
    unique: true,
    partialFilterExpression: { date: { $exists: true } },
  }
)

const MoodEntry = mongoose.model("MoodEntry", moodEntrySchema)

module.exports = MoodEntry
