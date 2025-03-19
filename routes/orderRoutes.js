const express = require("express");
const Order = require("../models/Order");
const { authMiddleware, adminMiddleware, userMiddleware } = require("../middleware/auth");

const router = express.Router();

// Place Order Route
router.post("/orders", authMiddleware, async (req, res) => {
    const { items, totalPrice, address, phone, paymentMethod } = req.body;
  
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Cart items are required" });
    }
  
    if (!address || !phone) {
      return res.status(400).json({ error: "Address and phone are required" });
    }
  
    try {
      const newOrder = new Order({
        userId: req.userId, // Add userId
        items,
        totalPrice,
        address,
        phone,
        paymentMethod,
      });
  
      await newOrder.save();
      res.json({ message: "Order placed successfully", order: newOrder });
    } catch (error) {
      console.error("Order placement error:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
  
// Get Orders for User
router.get("/orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId });
    res.json(orders);
  } catch (error) {
    console.error("Fetch orders error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 📌 ✅ New API - Get All Orders (Admin Only)
router.get("/all-orders", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const orders = await Order.find().populate("userId", "name email").sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Fetch all orders error:", error);
    res.status(500).json({ error: "Server error" });
  }
});
// 📌 ✅ Update Order Status (Admin Only)
router.patch("/orders/:id/status", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    // ✅ Allow only valid statuses
    const validStatuses = ["Pending", "Shipped", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    res.status(200).json({ message: "Order status updated successfully", order });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;
