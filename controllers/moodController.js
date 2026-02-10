const MoodEntry = require("../models/MoodEntry")
const User = require("../models/User")
const { analyzeMood: ollamaAnalyze } = require("../services/ollamaService")
const { notifyCaretaker } = require("../services/notificationService")

/**
 * @desc    Save a mood entry after daily check-in
 * @route   POST /api/mood/entry
 * @access  Private (elderly only)
 */
exports.saveMoodEntry = async (req, res) => {
  try {
    const { mood, moodScore, emotions, concerns, responses } = req.body

    if (!responses || responses.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Responses are required",
      })
    }

    // Use start of today as the date (to enforce one entry per day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const updateData = {
      userId: req.user._id,
      responses: responses || [],
      emotions: emotions || [],
      concerns: concerns || [],
      date: today,
    }

    // Only set mood/moodScore if provided (will be set later by Ollama)
    if (mood) {
      updateData.mood = mood
      updateData.moodScore = moodScore || (mood === "happy" ? 8 : mood === "sad" ? 3 : 5)
    }

    // Upsert: update if exists for today, create if not
    const entry = await MoodEntry.findOneAndUpdate(
      { userId: req.user._id, date: today },
      updateData,
      { upsert: true, new: true, runValidators: true }
    )

    // Update user's current mood if provided
    if (mood) {
      await User.findByIdAndUpdate(req.user._id, { currentMood: mood })
    }

    res.status(201).json({
      success: true,
      data: { entry },
    })
  } catch (error) {
    console.error("Error saving mood entry:", error)
    res.status(500).json({
      success: false,
      message: "Server error while saving mood entry",
    })
  }
}

/**
 * @desc    Analyze mood using Ollama AI (llama3) and store results
 * @route   POST /api/mood/analyze
 * @access  Private (elderly only)
 */
exports.analyzeMoodEntry = async (req, res) => {
  try {
    const { questionAnswers } = req.body
    const userId = req.user._id

    if (!questionAnswers || questionAnswers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Question answers are required for mood analysis",
      })
    }

    console.log(`[MoodController] Analyzing mood for user ${userId} with ${questionAnswers.length} answers`)

    // Step 1: Run AI mood analysis via Ollama
    const moodResult = await ollamaAnalyze(questionAnswers)
    console.log("[MoodController] Analysis result:", JSON.stringify(moodResult))

    // Step 2: Map detected mood to legacy mood field for backwards compatibility
    let legacyMood = "neutral"
    let moodScore = 5
    if (moodResult.mood === "Normal") {
      legacyMood = "happy"
      moodScore = 8
    } else if (moodResult.mood === "Stressed") {
      legacyMood = "neutral"
      moodScore = 4
    } else if (moodResult.mood === "Depressed") {
      legacyMood = "sad"
      moodScore = 2
    } else if (moodResult.mood === "Highly Depressed") {
      legacyMood = "sad"
      moodScore = 1
    }

    // Step 3: Build response array from question-answer pairs
    const responses = questionAnswers.map((qa) => ({
      question: qa.question,
      answer: qa.answer,
      category: qa.category || "",
    }))

    // Step 4: Store/update mood entry for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const entry = await MoodEntry.findOneAndUpdate(
      { userId, date: today },
      {
        userId,
        mood: legacyMood,
        moodScore,
        emotions: moodResult.emotionsDetected || [],
        responses,
        date: today,
        detectedMood: moodResult.mood,
        confidence: moodResult.confidence,
        emotionsDetected: moodResult.emotionsDetected || [],
        reason: moodResult.reason,
        analysisSource: moodResult.analysisSource,
      },
      { upsert: true, new: true, runValidators: true }
    )

    // Step 5: Update user's current mood
    const currentMoodMap = {
      Normal: "happy",
      Stressed: "stressed",
      Depressed: "depressed",
      "Highly Depressed": "depressed",
      Unknown: "neutral",
    }
    await User.findByIdAndUpdate(userId, {
      currentMood: currentMoodMap[moodResult.mood] || "neutral",
      lastActive: new Date(),
    })

    // Step 6: Trigger caretaker notification if mood is concerning
    await notifyCaretaker(userId, moodResult, entry._id)

    // Step 7: Return analysis result to frontend
    res.status(200).json({
      success: true,
      data: {
        mood: moodResult.mood,
        confidence: moodResult.confidence,
        emotionsDetected: moodResult.emotionsDetected,
        reason: moodResult.reason,
        analysisSource: moodResult.analysisSource,
        entryId: entry._id,
      },
    })
  } catch (error) {
    console.error("[MoodController] Error analyzing mood:", error)
    res.status(500).json({
      success: false,
      message: "Server error while analyzing mood",
    })
  }
}

/**
 * @desc    Get mood history for a user (weekly or monthly)
 * @route   GET /api/mood/history/:userId?period=weekly|monthly
 * @access  Private (caretaker or self)
 */
exports.getMoodHistory = async (req, res) => {
  try {
    const { userId } = req.params
    const { period } = req.query // "weekly" or "monthly"

    // Calculate date range
    const now = new Date()
    let startDate

    if (period === "monthly") {
      // Last 30 days
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 30)
    } else {
      // Default: last 7 days
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 7)
    }
    startDate.setHours(0, 0, 0, 0)

    const entries = await MoodEntry.find({
      userId,
      date: { $gte: startDate },
    })
      .sort({ date: 1 })
      .lean()

    // Build a complete date range with entries (fill missing days with null)
    const dateRange = []
    const entryMap = {}

    entries.forEach((entry) => {
      const dateKey = entry.date.toISOString().split("T")[0]
      entryMap[dateKey] = entry
    })

    const current = new Date(startDate)
    while (current <= now) {
      const dateKey = current.toISOString().split("T")[0]
      dateRange.push({
        date: dateKey,
        mood: entryMap[dateKey]?.mood || null,
        moodScore: entryMap[dateKey]?.moodScore || null,
        emotions: entryMap[dateKey]?.emotions || [],
        concerns: entryMap[dateKey]?.concerns || [],
        responses: entryMap[dateKey]?.responses || [],
      })
      current.setDate(current.getDate() + 1)
    }

    // Calculate summary statistics
    const validEntries = entries.filter((e) => e.moodScore)
    const avgScore =
      validEntries.length > 0
        ? validEntries.reduce((sum, e) => sum + e.moodScore, 0) /
          validEntries.length
        : 0

    const moodCounts = { happy: 0, sad: 0, neutral: 0 }
    entries.forEach((e) => {
      if (moodCounts[e.mood] !== undefined) {
        moodCounts[e.mood]++
      }
    })

    res.status(200).json({
      success: true,
      data: {
        period: period || "weekly",
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        entries: dateRange,
        summary: {
          totalEntries: entries.length,
          averageScore: Math.round(avgScore * 10) / 10,
          moodCounts,
          predominantMood:
            entries.length > 0
              ? Object.entries(moodCounts).reduce((a, b) =>
                  a[1] > b[1] ? a : b
                )[0]
              : "none",
        },
      },
    })
  } catch (error) {
    console.error("Error fetching mood history:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching mood history",
    })
  }
}

/**
 * @desc    Get check-in details (questions & answers) for a specific user and date
 * @route   GET /api/mood/checkin/:userId?date=YYYY-MM-DD
 * @access  Private (caretaker or self)
 */
exports.getCheckInDetails = async (req, res) => {
  try {
    const { userId } = req.params
    const { date } = req.query

    let queryDate
    if (date) {
      queryDate = new Date(date)
    } else {
      queryDate = new Date()
    }
    queryDate.setHours(0, 0, 0, 0)

    const entry = await MoodEntry.findOne({
      userId,
      date: queryDate,
    }).lean()

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "No check-in found for this date",
      })
    }

    res.status(200).json({
      success: true,
      data: {
        date: queryDate.toISOString().split("T")[0],
        mood: entry.mood,
        moodScore: entry.moodScore,
        emotions: entry.emotions,
        concerns: entry.concerns,
        responses: entry.responses || [],
      },
    })
  } catch (error) {
    console.error("Error fetching check-in details:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching check-in details",
    })
  }
}
