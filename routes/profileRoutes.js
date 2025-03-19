const express = require("express");
const { authMiddleware, adminMiddleware, userMiddleware } = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

// ✅ Get User Profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    // Find user by decoded `req.userId`
    const user = await User.findById(req.userId).select("-password"); // Exclude password field

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      name: user.name,
      email: user.email,
      profileImage: user.profileImage || null,
      address: user.address || null,
      phoneNumber: user.phoneNumber || null,
      shippingAddress: user.shippingAddress || null,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Update Profile
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, address, phoneNumber, shippingAddress, profileImage } = req.body;

    // Ensure user exists before updating
    let user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user profile fields
    user.name = name || user.name;
    user.address = address || user.address;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.shippingAddress = shippingAddress || user.shippingAddress;
    user.profileImage = profileImage || user.profileImage;

    await user.save();

    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
