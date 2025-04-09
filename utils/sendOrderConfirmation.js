// utils/sendOrderConfirmation.js
const nodemailer = require("nodemailer");
const pdf = require("html-pdf");

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "211240116028.it@gmail.com",
      pass: "ahuf iroz ywya htxg", // Use an app-specific password if 2FA is on
    },
  });
  

function generateInvoiceHtml(order) {
  return `
    <h2>Order Invoice</h2>
    <p><strong>Order ID:</strong> ${order._id}</p>
    <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
    <p><strong>Items:</strong></p>
    <ul>
      ${order.items
        .map(item => `<li>${item.name} - ${item.quantity} x ₹${item.price}</li>`)
        .join("")}
    </ul>
    <p><strong>Total:</strong> ₹${order.totalPrice}</p>
    <p><strong>Shipping Address:</strong> ${order.address}</p>
    <p><strong>Phone:</strong> ${order.phone}</p>
    <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
  `;
}

const sendOrderConfirmation = (order, userEmail) => {
  return new Promise((resolve, reject) => {
    const html = generateInvoiceHtml(order);

    // Generate PDF invoice
    pdf.create(html).toBuffer((err, buffer) => {
      if (err) return reject(err);

      const mailOptions = {
        from: '"AudioLoom Orders" <211240116028.it@gmail.com>',
        to: userEmail,
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

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) return reject(err);
        resolve(info);
      });
    });
  });
};

module.exports = sendOrderConfirmation;
