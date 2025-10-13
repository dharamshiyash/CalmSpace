const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Use environment variable or fallback to Atlas connection
    const uri = process.env.MONGO_URI || "mongodb+srv://yashdharamshi1810_db_user:nLO3BoTqn4WQMzhO@pbl.4bbqt74.mongodb.net/?retryWrites=true&w=majority&appName=PBL";
    
    console.log("🔗 Connecting to MongoDB...");
    console.log("📍 Using URI:", uri.includes('mongodb+srv://') ? 'MongoDB Atlas' : 'Local MongoDB');
    
    await mongoose.connect(uri); // no options needed in Mongoose 6+

    console.log("✅ MongoDB Atlas connected successfully");
    console.log("🌐 Database:", mongoose.connection.db.databaseName);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    throw err; // Re-throw instead of exiting process
  }
};

module.exports = connectDB;
