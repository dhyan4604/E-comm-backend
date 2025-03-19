const express = require("express");
const { getUsers, registerUser } = require("../controllers/userController");
const { authMiddleware, adminMiddleware, userMiddleware } = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

// Public Route: Register a new user
router.post("/users", registerUser);

// Private Route: Get all users (add authentication middleware for protection)
router.get("/users", getUsers);

// Update Address
router.post("/update-address", authMiddleware, async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: "Address is required" });

    await User.findByIdAndUpdate(req.userId, { address });
    res.json({ message: "Address updated successfully" });
  } catch (error) {
    console.error("Address update error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update Phone Number
router.post("/update-phone-number", authMiddleware, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: "Phone number is required" });

    await User.findByIdAndUpdate(req.userId, { phoneNumber });
    res.json({ message: "Phone number updated successfully" });
  } catch (error) {
    console.error("Phone number update error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update Shipping Address
router.post("/update-shipping-address", authMiddleware, async (req, res) => {
  try {
    const { shippingAddress } = req.body;
    if (!shippingAddress)
      return res.status(400).json({ error: "Shipping address is required" });

    await User.findByIdAndUpdate(req.userId, { shippingAddress });
    res.json({ message: "Shipping address updated successfully" });
  } catch (error) {
    console.error("Shipping address update error:", error);
    res.status(500).json({ error: "Server error" });
  }
});
// Delete user by ID
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Attempt to find and delete the user by ID
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully', user });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
