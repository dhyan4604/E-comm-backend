const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const productRoutes = require("./routes/productRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { sendOrderConfirmation } = require("./utils/sendOrderConfirmation");
const dashboardRoutes = require("./routes/dashboard");



const app = express();
const PORT = 5000;




// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB
connectDB();

// Routes
app.use("/api", authRoutes);
app.use("/api", profileRoutes);
app.use("/api", uploadRoutes);
app.use("/api", userRoutes);
app.use("/api", orderRoutes);
app.use("/api", productRoutes);
app.use("/api", adminRoutes);
app.use("/api", dashboardRoutes);



// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} 🚀`);
});
