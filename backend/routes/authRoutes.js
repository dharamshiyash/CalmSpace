// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", authController.register);
router.post("/verify", authController.verifyOTP);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/protected", authMiddleware, authController.protected);
router.put("/profile", authMiddleware, authController.updateProfile);
router.delete("/profile", authMiddleware, authController.deleteProfile);

module.exports = router;
