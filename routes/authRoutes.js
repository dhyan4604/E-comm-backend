const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer");

const router = express.Router();
const JWT_SECRET = "Dhyan04";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "211240116028.it@gmail.com",
    pass: "ahuf iroz ywya htxg", // Gmail App Password
  },
});

// Signup Route
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });

    // Send welcome email
    const mailOptions = {
      from: '"AudioLoom" <211240116028.it@gmail.com>',
      to: email,
      subject: "Welcome to AudioLoom!",
      html: `
        <h2>Hi ${name},</h2>
        <p>Thank you for signing up on <strong>AudioLoom</strong>! 🎧</p>
        <p>We’re thrilled to have you on board. Start exploring the best audio products now and enjoy your shopping experience.</p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <br>
        <p>Cheers,<br>The AudioLoom Team</p>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Signup email error:", error);
      } else {
        console.log("Signup email sent:", info.response);
      }
    });

    res.json({ token });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ error: "Invalid email or password" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // Send login email
    const loginTime = new Date().toLocaleString();
    const mailOptions = {
      from: `"AudioLoom" <211240116028.it@gmail.com>`,
      to: user.email,
      subject: "Account Login Notification",
      html: `
        <h2>Successful Login</h2>
        <p>Hello <strong>${user.name || "User"}</strong>,</p>
        <p>Your account was logged in on:</p>
        <p><strong>${loginTime}</strong></p>
        <p>If this wasn't you, please reset your password immediately.</p>
        <br/>
        <p>Thanks,<br/>AudioLoom Team</p>
      `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Email sending failed:", err);
      } else {
        console.log("Login email sent:", info.response);
      }
    });

    res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

const otpMap = new Map();

// Forgot Password - Send OTP
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Email not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpMap.set(email, otp);

    const mailOptions = {
      from: '"AudioLoom" <211240116028.it@gmail.com>',
      to: email,
      subject: "AudioLoom Password Reset OTP",
      text: `Your OTP to reset password is: ${otp}\nThis code is valid for 10 minutes.\n\nIf this wasn't you, please ignore or reset your password immediately.`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "OTP sent to your email" });

    setTimeout(() => otpMap.delete(email), 10 * 60 * 1000);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not send OTP" });
  }
});

// Reset Password - Confirm OTP + New Password + Success Email
router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const storedOtp = otpMap.get(email);
  if (storedOtp !== otp) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email }, { password: hashedPassword });
    otpMap.delete(email);

    // Send password reset confirmation email
    const mailOptions = {
      from: '"AudioLoom Support" <211240116028.it@gmail.com>',
      to: email,
      subject: "Password Reset Confirmation - AudioLoom",
      text: `Hi,\n\nYour password has been successfully reset for your AudioLoom account.\n\nIf you did not perform this action, please reset your password immediately or contact support.\n\nThank you,\nAudioLoom Team`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not reset password" });
  }
});

module.exports = router;
