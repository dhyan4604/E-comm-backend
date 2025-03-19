const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

// ✅ Hardcoded Values
const ADMIN_EMAIL = "admin@audioloom.com";
const ADMIN_PASSWORD = "4604";
const JWT_SECRET = "Dhyan04"; // Hardcoded JWT Secret

// ✅ Admin Login API
router.post("/adminlogin", async (req, res) => {
  const { email, password } = req.body;

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  // ✅ Generate JWT Token (valid for 1 hour)
  const token = jwt.sign({ email, role: "admin" }, JWT_SECRET, {
    expiresIn: "1h",
  });

  res.json({ token, userRole: "admin", message: "Login successful!" });
});

module.exports = router;
