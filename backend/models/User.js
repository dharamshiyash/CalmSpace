// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: false }, // Make password optional for Google OAuth users
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiresAt: { type: Date },
    profileImage: { type: String, default: null },
    googleId: { type: String, unique: true, sparse: true }, // sparse allows null values
    googleEmail: { type: String, lowercase: true, trim: true },
    googleName: { type: String, trim: true },
    googlePicture: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
