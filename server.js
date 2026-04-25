const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors({
  origin: "*"
}));
app.use(bodyParser.json());

/* =========================
   PORT (IMPORTANT FOR DEPLOYMENT)
========================= */
const PORT = process.env.PORT || 3000;

/* =========================
   OTP STORAGE
========================= */
let storedOTP = null;
let otpExpiry = null;

/* =========================
   DEBUG ENV CHECK
========================= */
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "Loaded ✅" : "Missing ❌");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded ✅" : "Missing ❌");

/* =========================
   EMAIL TRANSPORT
========================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* VERIFY GMAIL CONNECTION */
transporter.verify((error) => {
  if (error) {
    console.log("❌ Gmail NOT ready:", error.message);
  } else {
    console.log("📩 Gmail is ready to send emails");
  }
});

/* =========================
   RECIPIENTS
========================= */
const recipients = [
  "gordon.jw314@gmail.com",
  "bryang120611@gmail.com"
];

/* =========================
   OTP GENERATOR
========================= */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* =========================
   SEND OTP ROUTE
========================= */
app.post("/send-otp", async (req, res) => {
  const otp = generateOTP();

  storedOTP = otp;
  otpExpiry = Date.now() + 5 * 60 * 1000;

  console.log("📤 OTP Generated:", otp);

  try {
    const info = await transporter.sendMail({
      from: `IOSKI WALLET <${process.env.EMAIL_USER}>`,
      to: recipients.join(","),
      subject: "IOSKI WALLET OTP VERIFICATION",
      html: `
        <div style="font-family:Arial">
          <h2>IOSKI WALLET SECURITY</h2>
          <p>Your OTP code is:</p>
          <h1 style="letter-spacing:6px">${otp}</h1>
          <p>This code expires in 5 minutes.</p>
        </div>
      `
    });

    console.log("✅ Email sent:", info.messageId);

    return res.json({
      success: true,
      message: "OTP sent successfully"
    });

  } catch (err) {
    console.log("❌ Email error:", err.message);

    return res.json({
      success: false,
      message: "Failed to send OTP",
      error: err.message
    });
  }
});

/* =========================
   VERIFY OTP ROUTE
========================= */
app.post("/verify-otp", (req, res) => {
  const { otp } = req.body;

  if (!storedOTP) {
    return res.json({
      success: false,
      message: "No OTP requested"
    });
  }

  if (Date.now() > otpExpiry) {
    storedOTP = null;
    return res.json({
      success: false,
      message: "OTP expired"
    });
  }

  if (otp === storedOTP) {
    storedOTP = null;
    return res.json({
      success: true,
      message: "OTP verified successfully"
    });
  }

  return res.json({
    success: false,
    message: "Invalid OTP"
  });
});

/* =========================
   HEALTH CHECK ROUTE
========================= */
app.get("/", (req, res) => {
  res.send("IOSKI backend running 🚀");
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`🚀 IOSKI backend running on port ${PORT}`);
});