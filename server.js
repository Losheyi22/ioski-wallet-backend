const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors({ origin: "*" }));
app.use(bodyParser.json());

/* =========================
   PORT
========================= */
const PORT = process.env.PORT || 3000;

/* =========================
   OTP STORAGE
========================= */
let storedOTP = null;
let otpExpiry = null;

/* =========================
   ENV CHECK
========================= */
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "Loaded ✅" : "Missing ❌");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded ✅" : "Missing ❌");

/* =========================
   EMAIL SETUP
========================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((error) => {
  if (error) {
    console.log("❌ Gmail NOT ready:", error.message);
  } else {
    console.log("📩 Gmail is ready to send emails");
  }
});

/* =========================
   DEMO USER LOGIN (FIXED NAME HERE)
========================= */
const demoUser = {
  username: "jason",
  password: "1234",
  name: "Jason Gordon",   // ✅ FIXED HERE
  balance: 28600
};

/* =========================
   LOGIN ROUTE
========================= */
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === demoUser.username && password === demoUser.password) {
    return res.json({
      name: demoUser.name,
      balance: demoUser.balance
    });
  }

  return res.status(401).json({
    message: "Invalid login"
  });
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
   SEND OTP
========================= */
app.post("/send-otp", async (req, res) => {
  const otp = generateOTP();

  storedOTP = otp;
  otpExpiry = Date.now() + 5 * 60 * 1000;

  console.log("📤 OTP Generated:", otp);

  try {
    await transporter.sendMail({
      from: `IOSKI WALLET <${process.env.EMAIL_USER}>`,
      to: recipients.join(","),
      subject: "IOSKI WALLET OTP VERIFICATION",
      html: `
        <h2>IOSKI WALLET SECURITY</h2>
        <p>Your OTP code is:</p>
        <h1>${otp}</h1>
        <p>Expires in 5 minutes.</p>
      `
    });

    return res.json({
      success: true,
      message: "OTP sent successfully"
    });

  } catch (err) {
    return res.json({
      success: false,
      message: "Failed to send OTP",
      error: err.message
    });
  }
});

/* =========================
   VERIFY OTP
========================= */
app.post("/verify-otp", (req, res) => {
  const { otp } = req.body;

  if (!storedOTP) {
    return res.json({ success: false, message: "No OTP requested" });
  }

  if (Date.now() > otpExpiry) {
    storedOTP = null;
    return res.json({ success: false, message: "OTP expired" });
  }

  if (otp === storedOTP) {
    storedOTP = null;
    return res.json({ success: true, message: "OTP verified" });
  }

  return res.json({ success: false, message: "Invalid OTP" });
});

/* =========================
   HEALTH CHECK
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