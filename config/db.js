
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://dhyand86:Dhyan04@cluster0.pezb3.mongodb.net/mydatabase",
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log("MongoDB connected ✅");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
