const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/generate"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3"
const OLLAMA_TIMEOUT = 180000 // 180 seconds (llama3 can be slow on CPU)

/**
 * Build a structured prompt for mood analysis
 */
function buildMoodPrompt(questionAnswers) {
  const answersText = questionAnswers
    .map((qa, i) => `Q${i + 1} (${qa.category || "general"}): ${qa.question}\nA${i + 1}: ${qa.answer}`)
    .join("\n\n")

  return `You are a clinical psychologist analyzing an elderly person's emotional wellbeing. Be sensitive to subtle signs of distress - elderly people often understate their problems.

Here are their daily check-in responses:

${answersText}

ANALYSIS INSTRUCTIONS:
- Look carefully for ANY signs of loneliness, sadness, anxiety, stress, pain, sleep issues, or loss of appetite
- Even mild negative signals should shift the mood away from "Normal"
- If the person mentions feeling alone, not sleeping, not eating, pain, or worry, this is NOT "Normal"
- Classify the mood as one of: "Normal", "Stressed", "Depressed", "Highly Depressed"

MOOD GUIDE:
- "Normal" = ONLY if responses are clearly positive or genuinely neutral with no concerning signs
- "Stressed" = any signs of worry, mild anxiety, tension, minor sleep or appetite issues
- "Depressed" = sadness, hopelessness, withdrawal, loneliness, significant sleep/appetite problems
- "Highly Depressed" = severe depression indicators, expressions of worthlessness, giving up, extreme isolation

Respond with ONLY this JSON, nothing else:
{"mood":"Normal or Stressed or Depressed or Highly Depressed","confidence":"low or medium or high","emotionsDetected":["emotion1","emotion2"],"reason":"brief explanation"}`
}

/**
 * Call Ollama API with retry logic
 */
async function callOllama(prompt, retryCount = 0) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT)

  try {
    console.log(`[OllamaService] Calling Ollama (attempt ${retryCount + 1})...`)

    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 300,
        },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`Ollama HTTP error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("[OllamaService] Raw response received:", data.response?.substring(0, 200))
    return data.response
  } catch (error) {
    clearTimeout(timeout)

    if (retryCount < 1) {
      console.log(`[OllamaService] Retrying after error: ${error.message}`)
      return callOllama(prompt, retryCount + 1)
    }

    throw error
  }
}

/**
 * Parse JSON from Ollama response (handles markdown code blocks, extra text, multiline JSON)
 */
function parseOllamaResponse(responseText) {
  if (!responseText) return null

  const trimmed = responseText.trim()
  console.log("[OllamaService] Parsing response:", trimmed.substring(0, 300))

  // Try direct JSON parse
  try {
    return JSON.parse(trimmed)
  } catch (e) {
    // Continue to extraction methods
  }

  // Extract JSON from markdown code blocks
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1])
    } catch (e) {
      // Continue
    }
  }

  // Find the first { and last } to extract JSON object
  const firstBrace = trimmed.indexOf("{")
  const lastBrace = trimmed.lastIndexOf("}")
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const jsonCandidate = trimmed.substring(firstBrace, lastBrace + 1)
    try {
      return JSON.parse(jsonCandidate)
    } catch (e) {
      // Try cleaning up common issues (newlines, extra whitespace)
      try {
        const cleaned = jsonCandidate
          .replace(/[\r\n]+/g, " ")
          .replace(/\s+/g, " ")
        return JSON.parse(cleaned)
      } catch (e2) {
        // Continue
      }
    }
  }

  return null
}

/**
 * Validate and normalize the parsed mood result
 */
function validateMoodResult(parsed) {
  const validMoods = ["Normal", "Stressed", "Depressed", "Highly Depressed"]
  const validConfidences = ["low", "medium", "high"]

  if (!parsed || typeof parsed !== "object") return null

  const mood = validMoods.find(
    (m) => m.toLowerCase() === (parsed.mood || "").toLowerCase()
  )
  if (!mood) return null

  return {
    mood: mood,
    confidence: validConfidences.includes(parsed.confidence) ? parsed.confidence : "medium",
    emotionsDetected: Array.isArray(parsed.emotionsDetected)
      ? parsed.emotionsDetected.filter((e) => typeof e === "string").slice(0, 10)
      : [],
    reason: typeof parsed.reason === "string" ? parsed.reason.substring(0, 500) : "Analysis completed",
  }
}

/**
 * Rule-based fallback scoring when AI response is unclear
 */
function fallbackMoodAnalysis(questionAnswers) {
  const negativeKeywords = [
    "sad", "lonely", "alone", "tired", "pain", "hurt", "worried", "anxious",
    "scared", "afraid", "hopeless", "helpless", "depressed", "terrible",
    "awful", "miserable", "crying", "tears", "can't sleep", "no appetite",
    "don't want", "give up", "worthless", "useless", "nobody cares",
    "isolated", "empty", "numb", "exhausted", "overwhelmed", "bad",
    "not good", "not well", "not great", "not happy", "unhappy", "upset",
    "struggling", "difficult", "hard", "stress", "stressed", "nervous",
    "restless", "sleepless", "insomnia", "nightmare", "no energy",
    "low", "down", "blue", "gloomy", "bored", "dull", "sick", "weak",
    "uncomfortable", "suffering", "ache", "sore", "irritated", "angry",
    "frustrated", "annoyed", "neglected", "ignored", "abandoned",
    "no", "not really", "hardly", "barely", "poorly", "worse",
  ]

  const severeKeywords = [
    "hopeless", "worthless", "give up", "don't want to live", "no point",
    "end it", "can't go on", "nobody cares", "all alone", "nothing matters",
    "useless", "burden", "die", "death", "suicide", "kill", "no reason",
    "no purpose", "want to disappear", "cant take it", "miserable",
  ]

  const positiveKeywords = [
    "good", "great", "happy", "fine", "well", "wonderful", "blessed",
    "thankful", "grateful", "enjoyed", "fun", "relaxed", "peaceful",
    "calm", "comfortable", "loved", "supported", "better", "excellent",
    "amazing", "fantastic", "joyful", "cheerful", "content", "satisfied",
    "slept well", "ate well", "feeling okay", "pretty good", "not bad",
  ]

  let negativeScore = 0
  let severeScore = 0
  let positiveScore = 0
  const emotionsDetected = new Set()

  for (const qa of questionAnswers) {
    const answer = (qa.answer || "").toLowerCase()

    for (const keyword of negativeKeywords) {
      if (answer.includes(keyword)) {
        negativeScore++
        emotionsDetected.add(keyword)
      }
    }

    for (const keyword of severeKeywords) {
      if (answer.includes(keyword)) {
        severeScore++
      }
    }

    for (const keyword of positiveKeywords) {
      if (answer.includes(keyword)) {
        positiveScore++
      }
    }
  }

  let mood, reason

  if (severeScore >= 1) {
    mood = "Highly Depressed"
    reason = "Severe distress indicators detected in responses"
  } else if (negativeScore >= 3) {
    mood = "Depressed"
    reason = "Significant negative emotional indicators found across multiple responses"
  } else if (negativeScore >= 1 && negativeScore > positiveScore) {
    mood = "Stressed"
    reason = "Stress and worry indicators detected in responses"
  } else if (negativeScore >= 1 && positiveScore <= 1) {
    mood = "Stressed"
    reason = "Some negative indicators detected without strong positive signals"
  } else {
    mood = "Normal"
    reason = "Responses indicate a generally stable emotional state"
  }

  return {
    mood,
    confidence: "medium",
    emotionsDetected: Array.from(emotionsDetected).slice(0, 10),
    reason,
  }
}

/**
 * Main function: Analyze mood from question-answer pairs using Ollama
 */
async function analyzeMood(questionAnswers) {
  if (!questionAnswers || questionAnswers.length === 0) {
    return {
      mood: "Unknown",
      confidence: "low",
      emotionsDetected: [],
      reason: "No responses provided for analysis",
      analysisSource: "fallback",
    }
  }

  try {
    const prompt = buildMoodPrompt(questionAnswers)
    console.log("[OllamaService] Sending mood analysis request...")

    const responseText = await callOllama(prompt)
    const parsed = parseOllamaResponse(responseText)
    const validated = validateMoodResult(parsed)

    if (validated) {
      console.log("[OllamaService] AI analysis successful:", validated.mood)
      return { ...validated, analysisSource: "ai" }
    }

    // AI responded but couldn't parse - use fallback
    console.log("[OllamaService] Could not parse AI response, using fallback")
    const fallback = fallbackMoodAnalysis(questionAnswers)
    return { ...fallback, analysisSource: "fallback" }
  } catch (error) {
    console.error("[OllamaService] AI analysis failed:", error.message)

    // Ollama is down or errored - use fallback
    const fallback = fallbackMoodAnalysis(questionAnswers)
    return { ...fallback, analysisSource: "fallback" }
  }
}

module.exports = { analyzeMood }
