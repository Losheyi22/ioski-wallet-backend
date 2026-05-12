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
   EMAIL TRANSPORT (FIXED)
========================= */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  tls: {
    rejectUnauthorized: false
  }
});

/* VERIFY */
transporter.verify((error) => {
  if (error) {
    console.log("❌ MAIL ERROR:", error.message);
  } else {
    console.log("📩 Gmail ready");
  }
});

/* =========================
   DEMO USER
========================= */
const demoUser = {
  username: "jason",
  password: "1234",
  name: "Jason Gordon",
  balance: 28600
};

/* =========================
   LOGIN
========================= */
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === demoUser.username &&
    password === demoUser.password
  ) {
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
   OTP RECIPIENTS
========================= */
const recipients = [
  "gordon.jw314@gmail.com",
  "bryang120611@gmail.com"
];

/* =========================
   GENERATE OTP
========================= */
function generateOTP() {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
}

/* =========================
   SEND OTP
========================= */
app.post("/send-otp", async (req, res) => {

  try {

    const otp = generateOTP();

    storedOTP = otp;
    otpExpiry = Date.now() + 300000;

    console.log("📤 OTP:", otp);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipients.join(","),
      subject: "IOSKI OTP",
      html: `
        <h2>OTP Verification</h2>
        <h1>${otp}</h1>
        <p>Expires in 5 minutes</p>
      `
    });

    console.log("✅ OTP SENT");

    return res.json({
      success: true
    });

  } catch (err) {

    console.log("❌ OTP ERROR:", err.message);

    return res.status(500).json({
      success: false,
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
      message: "OTP verified"
    });
  }

  return res.json({
    success: false,
    message: "Invalid OTP"
  });

});

/* =========================
   HEALTH
========================= */
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

/* =========================
   START
========================= */
app.listen(PORT, () => {
  console.log(`🚀 Running on ${PORT}`);
});