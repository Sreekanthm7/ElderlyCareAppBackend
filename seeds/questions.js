const mongoose = require("mongoose")
require("dotenv").config()
const Question = require("../models/Question")

const questions = [
  // Emotional well-being (10 questions)
  {
    questionText: "How would you describe your overall mood today?",
    category: "emotional",
  },
  {
    questionText: "Have you felt hopeful or optimistic about anything recently?",
    category: "emotional",
  },
  {
    questionText: "Have you been feeling more irritable or frustrated than usual?",
    category: "emotional",
  },
  {
    questionText: "Did anything make you feel happy or grateful today?",
    category: "emotional",
  },
  {
    questionText: "Have you felt like crying or been tearful recently?",
    category: "emotional",
  },
  {
    questionText: "Do you feel content with how your day is going so far?",
    category: "emotional",
  },
  {
    questionText: "Have you been feeling more emotional than usual lately?",
    category: "emotional",
  },
  {
    questionText: "Is there something that has been making you feel down recently?",
    category: "emotional",
  },
  {
    questionText: "Do you feel at peace with yourself today?",
    category: "emotional",
  },
  {
    questionText: "Have you experienced any sudden mood changes today?",
    category: "emotional",
  },

  // Social connection (8 questions)
  {
    questionText: "Have you spoken to any family members or friends today?",
    category: "social",
  },
  {
    questionText: "Do you feel like you have someone to talk to when you need support?",
    category: "social",
  },
  {
    questionText: "Have you been feeling lonely or isolated lately?",
    category: "social",
  },
  {
    questionText: "Did you participate in any social activities or gatherings recently?",
    category: "social",
  },
  {
    questionText: "Do you feel valued and appreciated by the people around you?",
    category: "social",
  },
  {
    questionText: "Is there someone you wish you could spend more time with?",
    category: "social",
  },
  {
    questionText: "Have you felt disconnected from your community or neighborhood?",
    category: "social",
  },
  {
    questionText: "Do you feel comfortable asking for help when you need it?",
    category: "social",
  },

  // Physical health (8 questions)
  {
    questionText: "Are you experiencing any physical pain or discomfort today?",
    category: "physical",
  },
  {
    questionText: "Have you been able to eat your meals properly today?",
    category: "physical",
  },
  {
    questionText: "Have you taken all your medications as prescribed?",
    category: "physical",
  },
  {
    questionText: "How would you rate your energy level today?",
    category: "physical",
  },
  {
    questionText: "Have you been able to do any light exercise or physical activity?",
    category: "physical",
  },
  {
    questionText: "Are you experiencing any dizziness, headaches, or body aches?",
    category: "physical",
  },
  {
    questionText: "Have you been drinking enough water today?",
    category: "physical",
  },
  {
    questionText: "Do you feel physically strong enough to do your daily tasks?",
    category: "physical",
  },

  // Cognitive health (6 questions)
  {
    questionText: "Have you had difficulty remembering things today?",
    category: "cognitive",
  },
  {
    questionText: "Were you able to focus and concentrate on tasks today?",
    category: "cognitive",
  },
  {
    questionText: "Did you engage in any mentally stimulating activities like reading or puzzles?",
    category: "cognitive",
  },
  {
    questionText: "Have you felt confused or disoriented at any point today?",
    category: "cognitive",
  },
  {
    questionText: "Do you feel mentally sharp and alert today?",
    category: "cognitive",
  },
  {
    questionText: "Have you found it harder to make decisions or think clearly recently?",
    category: "cognitive",
  },

  // Sleep quality (6 questions)
  {
    questionText: "How well did you sleep last night?",
    category: "sleep",
  },
  {
    questionText: "Did you have trouble falling asleep or staying asleep?",
    category: "sleep",
  },
  {
    questionText: "Did you wake up feeling rested and refreshed this morning?",
    category: "sleep",
  },
  {
    questionText: "Have you been having any bad dreams or nightmares recently?",
    category: "sleep",
  },
  {
    questionText: "Do you feel sleepy or drowsy during the day?",
    category: "sleep",
  },
  {
    questionText: "Have your sleep patterns changed recently?",
    category: "sleep",
  },

  // Daily living (6 questions)
  {
    questionText: "Were you able to complete your daily routine comfortably today?",
    category: "daily-living",
  },
  {
    questionText: "Did you do any activities that you enjoy today?",
    category: "daily-living",
  },
  {
    questionText: "Do you feel safe and comfortable in your living environment?",
    category: "daily-living",
  },
  {
    questionText: "Is there anything in your daily life that feels overwhelming right now?",
    category: "daily-living",
  },
  {
    questionText: "Have you been able to get outside or enjoy some fresh air today?",
    category: "daily-living",
  },
  {
    questionText: "Do you feel like you have a good routine and structure to your day?",
    category: "daily-living",
  },

  // Anxiety & worry (6 questions)
  {
    questionText: "Is there anything particular that is worrying you right now?",
    category: "anxiety",
  },
  {
    questionText: "Have you been feeling anxious or nervous about anything?",
    category: "anxiety",
  },
  {
    questionText: "Do you feel overwhelmed by your thoughts sometimes?",
    category: "anxiety",
  },
  {
    questionText: "Have you been able to relax and feel calm today?",
    category: "anxiety",
  },
  {
    questionText: "Are you worried about your health or the health of someone close to you?",
    category: "anxiety",
  },
  {
    questionText: "Do you feel uncertain or fearful about the future?",
    category: "anxiety",
  },

  // Self-esteem & purpose (5 questions)
  {
    questionText: "Do you feel like you have a sense of purpose in your daily life?",
    category: "self-esteem",
  },
  {
    questionText: "Have you felt good about yourself today?",
    category: "self-esteem",
  },
  {
    questionText: "Do you feel like your opinions and feelings matter to others?",
    category: "self-esteem",
  },
  {
    questionText: "Is there something you are looking forward to in the coming days?",
    category: "self-esteem",
  },
  {
    questionText: "Do you feel that you are able to contribute positively to those around you?",
    category: "self-esteem",
  },
]

const seedQuestions = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("MongoDB connected for seeding...")

    // Clear existing questions
    await Question.deleteMany({})
    console.log("Cleared existing questions")

    // Insert all questions
    const inserted = await Question.insertMany(questions)
    console.log(`Seeded ${inserted.length} psychological questions`)

    // Show summary by category
    const categories = [...new Set(questions.map((q) => q.category))]
    for (const cat of categories) {
      const count = questions.filter((q) => q.category === cat).length
      console.log(`  ${cat}: ${count} questions`)
    }

    await mongoose.connection.close()
    console.log("Seeding complete. Connection closed.")
    process.exit(0)
  } catch (error) {
    console.error("Seeding error:", error)
    process.exit(1)
  }
}

seedQuestions()
