const Notification = require("../models/Notification")
const User = require("../models/User")

/**
 * Get risk level from detected mood
 */
function getRiskLevel(mood) {
  switch (mood) {
    case "Highly Depressed":
      return "critical"
    case "Depressed":
      return "high"
    case "Stressed":
      return "medium"
    default:
      return "low"
  }
}

/**
 * Build notification message
 */
function buildMessage(elderlyName, mood, riskLevel) {
  switch (mood) {
    case "Highly Depressed":
      return `URGENT: ${elderlyName} is showing signs of severe depression. Immediate attention recommended.`
    case "Depressed":
      return `ALERT: ${elderlyName} appears to be experiencing depression. Please check in with them soon.`
    case "Stressed":
      return `NOTE: ${elderlyName} is showing signs of stress and anxiety. Consider reaching out.`
    default:
      return `${elderlyName} completed their daily check-in. Mood: ${mood}.`
  }
}

/**
 * Notify caretaker about elderly user's mood if concerning
 * Only creates notifications for Depressed or Highly Depressed moods
 */
async function notifyCaretaker(elderlyUserId, moodResult, moodEntryId) {
  try {
    // Only alert for concerning moods
    if (moodResult.mood !== "Depressed" && moodResult.mood !== "Highly Depressed") {
      console.log("[NotificationService] Mood is not concerning, skipping notification")
      return null
    }

    // Get the elderly user to find their caretaker
    const elderlyUser = await User.findById(elderlyUserId).select("name caretakerId")
    if (!elderlyUser || !elderlyUser.caretakerId) {
      console.log("[NotificationService] No caretaker assigned, skipping notification")
      return null
    }

    const riskLevel = getRiskLevel(moodResult.mood)
    const message = buildMessage(elderlyUser.name, moodResult.mood, riskLevel)

    const notification = await Notification.create({
      caretakerId: elderlyUser.caretakerId,
      elderlyUserId: elderlyUserId,
      type: "mood_alert",
      detectedMood: moodResult.mood,
      riskLevel: riskLevel,
      message: message,
      emotionsDetected: moodResult.emotionsDetected || [],
      moodEntryId: moodEntryId,
    })

    console.log(
      `[NotificationService] Alert created for caretaker ${elderlyUser.caretakerId}: ${moodResult.mood} (${riskLevel})`
    )

    return notification
  } catch (error) {
    console.error("[NotificationService] Error creating notification:", error.message)
    return null
  }
}

module.exports = { notifyCaretaker }
