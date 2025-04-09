const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

router.get('/summary', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const orders = await Order.find();

    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    res.json({
      totalUsers,
      totalProducts,
      totalRevenue,
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard summary' });
  }
});

module.exports = router;
