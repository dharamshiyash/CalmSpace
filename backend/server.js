require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const fetch = require("node-fetch");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const journalRoutes = require("./routes/journalRoutes");
const profileRoutes = require("./routes/profileRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

// ✅ Connect to MongoDB
connectDB()
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ Database connection failed:", err.message));

app.use(express.json());
app.use(cookieParser());

// ✅ Session configuration (production-ready with MongoStore)
app.use(session({
  secret: process.env.SESSION_SECRET || "your-session-secret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: "sessions",
  }),
  cookie: {
    secure: process.env.NODE_ENV === "production", // only HTTPS in production
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// ✅ CORS configuration
app.use(cors({
  origin: [
    "https://calm-space-lilac.vercel.app",
    "http://localhost:3000"
  ],
  credentials: true
}));

app.options("*", cors());

// ✅ Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/profile", profileRoutes);

// ✅ ML Service Base URL
const ML_BASE_URL = "https://calmspace-aob4.onrender.com";

// -------------------------------------------------------------
// ML Service Connection Test
// -------------------------------------------------------------
(async () => {
  try {
    const res = await fetch(`${ML_BASE_URL}/docs`);
    if (res.ok) {
      console.log(`🤖 Connected successfully to ML Service at ${ML_BASE_URL}`);
    } else {
      console.warn(`⚠️ Could not verify ML Service (status ${res.status})`);
    }
  } catch (err) {
    console.warn("⚠️ ML Service not reachable:", err.message);
  }
})();

// ✅ ML proxy routes
app.post("/api/emotion", async (req, res) => {
  try {
    const response = await fetch(`${ML_BASE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("ML Service error:", response.status, text);
      return res.status(500).json({ error: "ML service returned error" });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("❌ Error connecting to ML service:", err);
    res.status(500).json({ error: "Error connecting to ML service" });
  }
});

app.post("/api/emotion/support", async (req, res) => {
  try {
    const response = await fetch(`${ML_BASE_URL}/support`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("ML Support Service error:", response.status, text);
      return res.status(500).json({ error: "ML support service returned error" });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("❌ Error connecting to ML support service:", err);
    res.status(500).json({ error: "Error connecting to ML support service" });
  }
});

// ✅ Root route
app.get("/", (req, res) => {
  res.send("✅ CalmSpace backend running and connected to frontend & ML service");
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend live on port ${PORT}`);
  console.log("🌐 Frontend:", "https://calm-space-lilac.vercel.app");
  console.log("🤖 ML Service:", ML_BASE_URL);
});
