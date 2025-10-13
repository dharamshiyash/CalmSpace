const JournalEntry = require("../models/JournalEntry");

exports.createEntry = async (req, res) => {
  try {
    const { text, mood } = req.body;
    if (!text || !mood) return res.status(400).json({ message: "Text and mood are required" });

    const entry = await JournalEntry.create({ user: req.user.id, text, mood });
    return res.status(201).json({ message: "Entry created", entry });
  } catch (err) {
    console.error("Create entry error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.listEntries = async (req, res) => {
  try {
    const entries = await JournalEntry.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    return res.json({ entries });
  } catch (err) {
    console.error("List entries error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.updateEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, mood } = req.body;
    
    const entry = await JournalEntry.findById(id);
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    if (String(entry.user) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    // Update only provided fields
    if (text !== undefined) entry.text = text;
    if (mood !== undefined) entry.mood = mood;
    
    await entry.save();
    return res.json({ message: "Entry updated", entry });
  } catch (err) {
    console.error("Update entry error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.deleteEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await JournalEntry.findById(id);
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    if (String(entry.user) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await entry.deleteOne();
    return res.json({ message: "Entry deleted" });
  } catch (err) {
    console.error("Delete entry error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Return mood distribution for the last 7 days and latest entries
exports.summary = async (req, res) => {
  try {
    const userId = req.user.id;
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const lastWeekEntries = await JournalEntry.find({
      user: userId,
      createdAt: { $gte: since },
    }).sort({ createdAt: -1 });

    const moodCounts = {
      sadness: 0,
      joy: 0,
      love: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
    };

    lastWeekEntries.forEach((e) => {
      if (moodCounts[e.mood] !== undefined) moodCounts[e.mood] += 1;
    });

    const recentEntries = await JournalEntry.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(3);

    return res.json({ moodCounts, recentEntries });
  } catch (err) {
    console.error("Summary error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
