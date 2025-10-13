const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const journal = require("../controllers/journalController");

router.get("/", auth, journal.listEntries);
router.get("/summary", auth, journal.summary);
router.post("/", auth, journal.createEntry);
router.put("/:id", auth, journal.updateEntry);
router.delete("/:id", auth, journal.deleteEntry);

module.exports = router;
