// ✅ Load environment variables
require("dotenv").config();

// ✅ Core modules
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const fetch = require("node-fetch");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");

// ✅ Local imports
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const journalRoutes = require("./routes/journalRoutes");
const profileRoutes = require("./routes/profileRoutes");

// ✅ Initialize app
const app = express();
const PORT = process.env.PORT || 5001;

// -------------------------------------------------------------
// 🔗 Connect to MongoDB Atlas
// -------------------------------------------------------------
connectDB()
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ Database connection failed:", err.message));

// -------------------------------------------------------------
// 🌍 CORS Configuration — must come BEFORE cookies/sessions
// -------------------------------------------------------------
app.use(cors({
  origin: [
    "https://calm-space-lilac.vercel.app", // Frontend (Vercel)
    "http://localhost:3000"                // Local dev
  ],
  credentials: true,                       // Allow cookies to be sent
}));

app.options("*", cors()); // Preflight support

// -------------------------------------------------------------
// 🧠 Middleware
// -------------------------------------------------------------
app.use(express.json());
app.use(cookieParser());

// -------------------------------------------------------------
// 🛡️ Session Configuration
// -------------------------------------------------------------
app.set("trust proxy", 1); // Required for secure cookies behind Render’s proxy

app.use(session({
  secret: process.env.SESSION_SECRET || "your-session-secret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: "sessions",
  }),
  cookie: {
    secure: true,           // ✅ HTTPS only (Render provides HTTPS)
    httpOnly: true,         // ✅ Cannot be accessed by JS
    sameSite: "none",       // ✅ Allow cross-site cookie (Render ↔ Vercel)
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// -------------------------------------------------------------
// 🔐 Passport Middleware
// -------------------------------------------------------------
app.use(passport.initialize());
app.use(passport.session());

// -------------------------------------------------------------
// 🗂️ Static Files
// -------------------------------------------------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -------------------------------------------------------------
// 🛣️ API Routes
// -------------------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/profile", profileRoutes);

// -------------------------------------------------------------
// 🤖 ML Service Proxy
// -------------------------------------------------------------
const ML_BASE_URL = "https://calmspace-aob4.onrender.com";

// 🔍 Test connection to ML Service
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

// 🧠 Emotion Prediction Endpoint
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

// 🧘 Support Route (Recommendation)
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

// -------------------------------------------------------------
// 🏠 Root Route
// -------------------------------------------------------------
app.get("/", (req, res) => {
  res.send("✅ CalmSpace backend running and connected to frontend & ML service");
});

// -------------------------------------------------------------
// 🚀 Start Server
// -------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Backend live on port ${PORT}`);
  console.log("🌐 Frontend:", "https://calm-space-lilac.vercel.app");
  console.log("🤖 ML Service:", ML_BASE_URL);
});
