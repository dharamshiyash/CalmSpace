const mongoose = require("mongoose");

const JournalEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    mood: {
      type: String,
    enum: ["sadness", "joy", "love", "anger", "fear", "surprise"],
      required: true,
      default: "joy",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JournalEntry", JournalEntrySchema);
