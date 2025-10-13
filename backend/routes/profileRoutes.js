const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const profileController = require("../controllers/profileController");

// Profile image routes
router.post("/image", auth, profileController.uploadProfileImage, profileController.updateProfileImage);
router.delete("/image", auth, profileController.removeProfileImage);

module.exports = router;
