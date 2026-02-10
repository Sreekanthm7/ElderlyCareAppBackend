const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

// Define emergency contact subdocument schema
const emergencyContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, "Please provide a valid 10-digit phone number"],
    },
    relation: {
      type: String,
      required: true,
    },
  },
  { _id: false }
)

const userSchema = new mongoose.Schema(
  {
    // Common fields for both roles
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^[0-9]{10}$/, "Please provide a valid 10-digit phone number"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Don't return password in queries by default
    },

    role: {
      type: String,
      required: [true, "User role is required"],
      enum: {
        values: ["elderly", "caretaker"],
        message: "Role must be either elderly or caretaker",
      },
    },

    // Elderly-specific fields
    age: {
      type: Number,
      required: function () {
        return this.role === "elderly"
      },
      min: [60, "Elderly user must be at least 60 years old"],
      max: [120, "Age cannot exceed 120"],
    },

    address: {
      type: String,
      required: function () {
        return this.role === "elderly"
      },
      trim: true,
    },

    medicalConditions: {
      type: [String],
      default: [],
    },

    emergencyContact: {
      type: emergencyContactSchema,
      required: function () {
        return this.role === "elderly"
      },
    },

    // Reference to assigned caretaker (only for elderly users)
    caretakerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.role === "elderly"
      },
      validate: {
        validator: async function (value) {
          // Only validate if role is elderly and caretakerId is provided
          if (this.role !== "elderly" || !value) return true

          const caretaker = await mongoose.model("User").findById(value)
          return caretaker && caretaker.role === "caretaker"
        },
        message:
          "Invalid caretaker assignment. Caretaker must exist and have caretaker role.",
      },
    },

    // Caretaker-specific fields
    experience: {
      type: Number,
      required: function () {
        return this.role === "caretaker"
      },
      min: [0, "Experience cannot be negative"],
    },

    specialization: {
      type: String,
      default: "",
    },

    certification: {
      type: String,
      default: "",
    },

    availability: {
      type: Boolean,
      default: true,
    },

    // Elderly tracking fields
    healthStatus: {
      type: String,
      enum: ["good", "fair", "needs-attention"],
      default: "good",
    },

    currentMood: {
      type: String,
      enum: ["happy", "sad", "neutral", "stressed", "depressed"],
      default: "neutral",
    },

    lastActive: {
      type: Date,
      default: Date.now,
    },

    // Common fields
    profilePicture: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Virtual field to get all elderly users assigned to a caretaker
userSchema.virtual("assignedElderly", {
  ref: "User",
  localField: "_id",
  foreignField: "caretakerId",
  match: { role: "elderly" },
})

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  // Only hash password if it has been modified or is new
  if (!this.isModified("password")) {
    return next()
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw new Error("Password comparison failed")
  }
}

// Method to get user object without sensitive data
userSchema.methods.toSafeObject = function () {
  const userObj = this.toObject()
  delete userObj.password
  delete userObj.__v
  return userObj
}

// Index for faster queries (email already has unique index from schema)
userSchema.index({ role: 1 })
userSchema.index({ caretakerId: 1 })

const User = mongoose.model("User", userSchema)

module.exports = User
