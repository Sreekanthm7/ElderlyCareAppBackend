const express = require("express")
const router = express.Router()
const { saveMoodEntry, analyzeMoodEntry, getMoodHistory, getCheckInDetails } = require("../controllers/moodController")
const { protect } = require("../middleware/auth")

// Save mood entry (elderly users after daily check-in)
router.post("/entry", protect, saveMoodEntry)

// Analyze mood using Ollama AI (elderly users after answering questions)
router.post("/analyze", protect, analyzeMoodEntry)

// Get mood history for a user (caretaker viewing elderly user's history)
router.get("/history/:userId", protect, getMoodHistory)

// Get check-in details (questions & answers) for a specific user and date
router.get("/checkin/:userId", protect, getCheckInDetails)

module.exports = router
