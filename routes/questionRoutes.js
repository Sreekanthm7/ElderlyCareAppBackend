const express = require("express")
const router = express.Router()
const {
  getDailyQuestions,
  getAllQuestions,
} = require("../controllers/questionController")
const { protect, authorize } = require("../middleware/auth")

// Public route - get 5 daily questions
router.get("/daily", getDailyQuestions)

// Protected route - get all questions (caretakers only)
router.get("/", protect, authorize("caretaker"), getAllQuestions)

module.exports = router
