const mongoose = require("mongoose")

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
      unique: true,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: [
          "emotional",
          "social",
          "physical",
          "cognitive",
          "sleep",
          "daily-living",
          "anxiety",
          "self-esteem",
        ],
        message: "Invalid category",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

questionSchema.index({ category: 1 })
questionSchema.index({ isActive: 1 })

const Question = mongoose.model("Question", questionSchema)

module.exports = Question
