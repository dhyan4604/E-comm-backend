const express = require("express");
const Order = require("../models/Order");
const User = require("../models/User"); 
const { authMiddleware, adminMiddleware, userMiddleware } = require("../middleware/auth");
const nodemailer = require("nodemailer");
const pdf = require("html-pdf");

const router = express.Router();


function generateInvoiceHtml(order) {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; max-width: 700px; margin: auto; border-radius: 10px; box-shadow: 0 0 15px rgba(0,0,0,0.1); background: #fff; border: 1px solid #ccc;">
      <div style="text-align: center; background: linear-gradient(90deg, #6a11cb 0%, #2575fc 100%); padding: 20px; color: white; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0;">🧾 AudioLoom</h1>
        <h3 style="margin-top: 5px;">Order Invoice</h3>
      </div>

      <div style="padding: 20px;">
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>

        <h3 style="color: #333; margin-top: 30px;">🛒 Items</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f0f0f0; color: #444;">
              <th style="padding: 12px; border: 1px solid #ddd;">Product</th>
              <th style="padding: 12px; border: 1px solid #ddd;">Qty</th>
              <th style="padding: 12px; border: 1px solid #ddd;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${order.items
              .map(
                (item, i) => `
                <tr style="background-color: ${i % 2 === 0 ? "#fafafa" : "#fefefe"};">
                  <td style="padding: 10px; border: 1px solid #eee;">${item.name}</td>
                  <td style="padding: 10px; border: 1px solid #eee; text-align: center;">${item.quantity}</td>
                  <td style="padding: 10px; border: 1px solid #eee;">₹${item.price}</td>
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>

        <div style="text-align: right; margin-top: 20px;">
          <h3 style="color: #444;">Total: <span style="color: #2575fc;">₹${order.totalPrice}</span></h3>
        </div>

        <div style="margin-top: 30px;">
          <h3 style="color: #333;">📦 Shipping Details</h3>
          <p><strong>Address:</strong> ${order.address}</p>
          <p><strong>Phone:</strong> ${order.phone}</p>
          <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        </div>

        <p style="text-align: center; margin-top: 40px; color: #777; font-style: italic;">
          Thank you for shopping with <strong>AudioLoom</strong>! 🎶<br>
          Visit us again for more premium audio products.
        </p>
      </div>
    </div>
  `;
}

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

router.put("/orders/:id/cancel", authMiddleware, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  order.status = "Cancelled";
  await order.save();

  res.json({ message: "Order cancelled successfully" });
});

module.exports = router;
