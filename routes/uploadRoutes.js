const express = require("express");
const multer = require("multer");
const path = require("path");
const { authMiddleware, adminMiddleware, userMiddleware } = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, `${req.userId}-${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({ storage });

// Upload Profile Image
router.post(
  "/upload-profile-image",
  authMiddleware,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const imageUrl = `/uploads/${req.file.filename}`;
      await User.findByIdAndUpdate(req.userId, { profileImage: imageUrl });

      res.json({ message: "Profile image updated", profileImage: imageUrl });
    } catch (error) {
      console.error("Profile image upload error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
