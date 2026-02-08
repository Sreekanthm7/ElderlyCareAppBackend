const User = require("../models/User")
const jwt = require("jsonwebtoken")

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  })
}

/**
 * @desc    Register a new caretaker
 * @route   POST /api/auth/register-caretaker
 * @access  Public
 */
exports.registerCaretaker = async (req, res) => {
  try {
    const { name, email, phone, password, experience, specialization } =
      req.body

    // Validate required fields
    if (!name || !email || !phone || !password || experience === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields: name, email, phone, password, and experience",
      })
    }

    // Validate phone number format
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits",
      })
    }

    // Validate experience
    const experienceNum = Number(experience)
    if (isNaN(experienceNum) || experienceNum < 0) {
      return res.status(400).json({
        success: false,
        message: "Experience must be a non-negative number",
      })
    }

    // Check if caretaker already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      })
    }

    // Create caretaker
    const caretaker = await User.create({
      name,
      email,
      phone,
      password,
      role: "caretaker",
      experience: experienceNum,
      specialization: specialization || "",
    })

    // Generate token
    const token = generateToken(caretaker._id)

    res.status(201).json({
      success: true,
      message: "Caretaker registered successfully",
      data: {
        user: caretaker.toSafeObject(),
        token,
      },
    })
  } catch (error) {
    console.error("Caretaker registration error:", error)

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.length > 0 ? errors : [error.message],
      })
    }

    // Handle duplicate key error (email)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      })
    }

    res.status(500).json({
      success: false,
      message: "Server error during caretaker registration",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    })
  }
}

/**
 * @desc    Register a new elderly user with caretaker assignment
 * @route   POST /api/auth/register-elderly
 * @access  Public (or can be protected based on requirements)
 */
exports.registerElderly = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      age,
      address,
      caretakerId,
      emergencyContact,
    } = req.body

    // Validate required fields
    if (
      !name ||
      !email ||
      !phone ||
      !password ||
      !age ||
      !address ||
      !caretakerId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields: name, email, phone, password, age, address, and caretakerId",
      })
    }

    // Validate emergency contact
    if (
      !emergencyContact ||
      !emergencyContact.name ||
      !emergencyContact.phone ||
      !emergencyContact.relation
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide complete emergency contact information (name, phone, relation)",
      })
    }

    // Validate phone number format
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits",
      })
    }

    if (!/^[0-9]{10}$/.test(emergencyContact.phone)) {
      return res.status(400).json({
        success: false,
        message: "Emergency contact phone number must be exactly 10 digits",
      })
    }

    // Validate age
    const ageNum = Number(age)
    if (isNaN(ageNum) || ageNum < 60 || ageNum > 120) {
      return res.status(400).json({
        success: false,
        message: "Age must be a number between 60 and 120",
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      })
    }

    // Validate that caretaker exists and has correct role
    const caretaker = await User.findById(caretakerId)
    if (!caretaker) {
      return res.status(404).json({
        success: false,
        message: "Caretaker not found",
      })
    }

    if (caretaker.role !== "caretaker") {
      return res.status(400).json({
        success: false,
        message: "Invalid caretaker. The assigned user is not a caretaker.",
      })
    }

    // Create elderly user
    const elderly = await User.create({
      name,
      email,
      phone,
      password,
      role: "elderly",
      age: ageNum,
      address,
      caretakerId,
      emergencyContact,
    })

    // Generate token
    const token = generateToken(elderly._id)

    // Populate caretaker details
    await elderly.populate("caretakerId", "name email phone experience")

    res.status(201).json({
      success: true,
      message: "Elderly user registered successfully",
      data: {
        user: elderly.toSafeObject(),
        token,
      },
    })
  } catch (error) {
    console.error("Elderly registration error:", error)

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.length > 0 ? errors : [error.message],
      })
    }

    // Handle duplicate key error (email)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      })
    }

    res.status(500).json({
      success: false,
      message: "Server error during elderly user registration",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    })
  }
}

/**
 * @desc    Login user (both elderly and caretaker)
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    console.log("Login attempt for email:", email)

    // Validate input
    if (!email || !password) {
      console.log("Missing email or password")
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      })
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select("+password")

    if (!user) {
      console.log("User not found:", email)
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    console.log("User found:", user.name, "Role:", user.role)

    // Check if account is active
    if (!user.isActive) {
      console.log("Account inactive:", email)
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Please contact support.",
      })
    }

    // Compare password
    const isPasswordMatch = await user.comparePassword(password)

    if (!isPasswordMatch) {
      console.log("Password mismatch for:", email)
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    console.log("Password verified, updating lastActive...")

    // Update lastActive timestamp for elderly users
    if (user.role === "elderly") {
      user.lastActive = new Date()
      await user.save()
    }

    // Generate token
    const token = generateToken(user._id)
    console.log("Token generated")

    // Populate caretaker info if user is elderly
    if (user.role === "elderly") {
      await user.populate("caretakerId", "name email phone experience")
    }

    const userObject = user.toSafeObject()
    console.log(
      "Sending response with user:",
      userObject.name,
      "role:",
      userObject.role
    )

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: userObject,
        token,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    })
  }
}

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Populate caretaker info if user is elderly
    if (user.role === "elderly") {
      await user.populate("caretakerId", "name email phone experience")
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.toSafeObject(),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}
