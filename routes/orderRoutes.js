const express = require("express");
const Order = require("../models/Order");
const User = require("../models/User"); // Assuming you have this
const { authMiddleware, adminMiddleware, userMiddleware } = require("../middleware/auth");
const nodemailer = require("nodemailer");
const pdf = require("html-pdf");

const router = express.Router();

// Utility: Generate Invoice HTML
function generateInvoiceHtml(order) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #eee;">
      <h2 style="text-align: center; color: #333;">🧾 AudioLoom Order Invoice</h2>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>

      <h3 style="color: #555; border-bottom: 1px solid #ccc;">Items:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 8px; border: 1px solid #ddd;">Product</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Qty</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${order.items
            .map(
              (item) => `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">₹${item.price}</td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>

      <h3 style="text-align: right; margin-top: 20px;">Total: ₹${order.totalPrice}</h3>

      <p><strong>Shipping Address:</strong> ${order.address}</p>
      <p><strong>Phone:</strong> ${order.phone}</p>
      <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>

      <p style="text-align: center; margin-top: 30px; font-style: italic;">Thank you for shopping with AudioLoom!</p>
    </div>
  `;
};

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "211240116028.it@gmail.com",
      pass: "ahuf iroz ywya htxg", // Use an app-specific password if 2FA is on
    },
  });
  

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
      userId: req.userId,
      items,
      totalPrice,
      address,
      phone,
      paymentMethod,
    });

    await newOrder.save();

    // Fetch user email
    const user = await User.findById(req.userId);
    if (user && user.email) {
      const html = generateInvoiceHtml(newOrder);

      // Create PDF and send email
      pdf.create(html).toBuffer((err, buffer) => {
        if (err) {
          console.error("PDF generation error:", err);
        } else {
          const mailOptions = {
            from: '"AudioLoom Orders" <211240116028.it@gmail.com>',
            to: user.email,
            subject: "Order Confirmation - AudioLoom",
            text: "Thank you for your order! Your invoice is attached.",
            attachments: [
              {
                filename: "invoice.pdf",
                content: buffer,
                contentType: "application/pdf",
              },
            ],
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error("Email sending error:", error);
            } else {
              console.log("Email sent:", info.response);
            }
          });
        }
      });
    }

    res.json({ message: "Order placed successfully", order: newOrder });
  } catch (error) {
    console.error("Order placement error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

  
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
// ✅ Update Order Status
router.put("/update-status/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    await order.save();

    res.status(200).json({ message: "Order status updated successfully", order });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
