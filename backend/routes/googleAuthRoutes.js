const express = require("express");
const router = express.Router();
const passport = require("passport");
const googleAuthController = require("../controllers/googleAuthController");

// Setup Google OAuth strategy
googleAuthController.setupGoogleStrategy(passport);

// Google OAuth routes
router.get("/google", googleAuthController.googleAuth(passport));
router.get("/google/callback", 
  googleAuthController.googleCallback(passport),
  googleAuthController.googleCallbackHandler
);

// Check if user exists (for registration validation)
router.post("/check-user", googleAuthController.checkUserExists);

module.exports = router;
