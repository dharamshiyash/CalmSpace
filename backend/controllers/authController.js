// controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const generateOTP = require("../utils/generateOTP");
const { sendEmail } = require("../utils/sendEmail");

const SALT_ROUNDS = 10;

// ------------------- REGISTER -------------------
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = new User({
      username,
      email,
      password: hashed,
      otp,
      otpExpiresAt,
      isVerified: false,
    });

    await user.save();

    try {
      const subject = "Your verification code";
      const text = `Your OTP is ${otp}. It expires in 10 minutes.`;
      const html = `<p>Your OTP is <b>${otp}</b>. It expires in 10 minutes.</p>`;
      await sendEmail({ to: email, subject, text, html });
    } catch (emailErr) {
      console.error("Failed to send OTP email:", emailErr);
    }

    return res.status(201).json({ message: "Registered. Verification code sent to your email." });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------- VERIFY OTP -------------------
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "User already verified" });
    if (!user.otp || !user.otpExpiresAt)
      return res.status(400).json({ message: "No OTP found for user" });

    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired. Please register again." });
    }

    if (user.otp !== otp) return res.status(400).json({ message: "Incorrect OTP" });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    return res.json({ message: "Verified. You can now log in." });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------- LOGIN -------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });
    if (!user.isVerified)
      return res.status(403).json({ message: "Email not verified. Please verify OTP first." });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Invalid credentials" });

    // Create JWT
    const payload = { id: user._id, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    // ✅ Set cookie with correct cross-domain settings
    res.cookie(process.env.COOKIE_NAME || "token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only on Render
      sameSite: "none", // Allow cross-site (Render ↔ Vercel)
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    return res.json({
      message: "Logged in successfully",
      user: { id: user._id, email: user.email, username: user.username },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------- LOGOUT -------------------
exports.logout = async (req, res) => {
  res.clearCookie(process.env.COOKIE_NAME || "token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  });
  return res.json({ message: "Logged out" });
};

// ------------------- PROTECTED ROUTE -------------------
exports.protected = async (req, res) => {
  try {
    // ✅ Decode JWT from cookie directly
    const token = req.cookies[process.env.COOKIE_NAME || "token"];
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password -otp -otpExpiresAt");
    if (!user) return res.status(401).json({ message: "User not found" });

    return res.json({ message: "Protected data", user });
  } catch (err) {
    console.error("Protected route error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ------------------- UPDATE PROFILE -------------------
exports.updateProfile = async (req, res) => {
  try {
    // ✅ Verify token first
    const token = req.cookies[process.env.COOKIE_NAME || "token"];
    if (!token) return res.status(401).json({ message: "Not authenticated" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { username, email } = req.body;
    if (!username && !email)
      return res.status(400).json({ message: "At least one field is required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check email conflict
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser)
        return res.status(400).json({ message: "Email already in use" });
    }

    if (username) user.username = username;
    if (email) user.email = email;

    await user.save();
    const updatedUser = await User.findById(userId).select("-password -otp -otpExpiresAt");

    return res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ------------------- DELETE PROFILE -------------------
exports.deleteProfile = async (req, res) => {
  try {
    // ✅ Verify token first
    const token = req.cookies[process.env.COOKIE_NAME || "token"];
    if (!token) return res.status(401).json({ message: "Not authenticated" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await User.findByIdAndDelete(userId);

    // Clear auth cookie
    res.clearCookie(process.env.COOKIE_NAME || "token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    });

    return res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete profile error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
