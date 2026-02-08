const Question = require("../models/Question")

/**
 * Simple hash function to create a deterministic seed from a date string.
 * Ensures the same 5 questions are returned for the entire day.
 */
const hashDateSeed = (dateStr) => {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Deterministic shuffle using a seed value.
 * Same seed always produces the same shuffle order.
 */
const seededShuffle = (array, seed) => {
  const shuffled = [...array]
  let currentSeed = seed

  for (let i = shuffled.length - 1; i > 0; i--) {
    // Simple linear congruential generator
    currentSeed = (currentSeed * 1664525 + 1013904223) & 0xffffffff
    const j = Math.abs(currentSeed) % (i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
}

/**
 * @desc    Get 5 random daily questions (same set for the whole day)
 * @route   GET /api/questions/daily
 * @access  Public
 */
exports.getDailyQuestions = async (req, res) => {
  try {
    const allQuestions = await Question.find({ isActive: true })

    if (allQuestions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No questions available",
      })
    }

    // Use today's date as seed so the same 5 questions are returned all day
    const today = new Date().toISOString().split("T")[0] // e.g., "2026-02-08"
    const seed = hashDateSeed(today)

    const shuffled = seededShuffle(allQuestions, seed)
    const dailyQuestions = shuffled.slice(0, 5)

    res.status(200).json({
      success: true,
      count: dailyQuestions.length,
      date: today,
      data: {
        questions: dailyQuestions.map((q) => ({
          _id: q._id,
          questionText: q.questionText,
          category: q.category,
        })),
      },
    })
  } catch (error) {
    console.error("Error fetching daily questions:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching questions",
      error: error.message,
    })
  }
}

/**
 * @desc    Get all questions
 * @route   GET /api/questions
 * @access  Private (caretaker/admin)
 */
exports.getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find({ isActive: true }).sort({
      category: 1,
    })

    res.status(200).json({
      success: true,
      count: questions.length,
      data: { questions },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching questions",
      error: error.message,
    })
  }
}
