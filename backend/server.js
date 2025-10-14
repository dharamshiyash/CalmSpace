// server.js
require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const fetch = require("node-fetch");
const passport = require("passport");
const session = require("express-session");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const journalRoutes = require("./routes/journalRoutes");
const profileRoutes = require("./routes/profileRoutes");
// const googleAuthRoutes = require("./routes/googleAuthRoutes"); // Disabled

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to database (with error handling)
connectDB().catch(err => {
  console.error("Database connection failed:", err.message);
  console.log("Server will continue without database connection for testing");
});

app.use(express.json());
app.use(cookieParser());

// Session configuration for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || "your-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Enable CORS for frontend (adjust origin as needed)
app.use(cors({
  origin: [
    "https://calm-space-lilac.vercel.app", 
    "http://localhost:3000"                 
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
// app.use("/api/auth", googleAuthRoutes); // Disabled
app.use("/api/journal", journalRoutes);
app.use("/api/profile", profileRoutes);

// Proxy request from frontend → backend → ML service
app.post("/api/emotion", async (req, res) => {
  const { text } = req.body;
  try {
    const response = await fetch("http://localhost:8000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error connecting to ML service" });
  }
});

// New proxy: text + mood → ML service support pipeline
app.post("/api/emotion/support", async (req, res) => {
  const { text, mood } = req.body || {};
  try {
    const response = await fetch("http://localhost:8000/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, mood }),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error connecting to ML support service" });
  }
});

// basic root
app.get("/", (req, res) => res.send("MERN Auth OTP backend running"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
