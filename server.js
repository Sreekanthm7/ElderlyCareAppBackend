const express = require("express")
const cors = require("cors")
require("dotenv").config()
const connectDB = require("./config/database")

const app = express()
const PORT = process.env.PORT || 5000

// Connect to MongoDB
connectDB()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Import routes
const authRoutes = require("./routes/authRoutes")
const userRoutes = require("./routes/userRoutes")
const caretakerRoutes = require("./routes/caretakerRoutes")

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "Elderly Care App Backend is running!",
    status: "Active",
    version: "1.0.0",
  })
})

// API routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/caretaker", caretakerRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
  console.log(`API Base URL: http://localhost:${PORT}/api`)
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`)
})
