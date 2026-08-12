require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const DATA_FILE = path.join(__dirname, "submissions.json");

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "[]");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post("/api/submit-form", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: "All fields required" });
  }

  const existingData = JSON.parse(fs.readFileSync(DATA_FILE));

  const newEntry = {
    id: Date.now(),
    name,
    email,
    message,
    submittedAt: new Date().toISOString(),
  };

  existingData.push(newEntry);
  fs.writeFileSync(DATA_FILE, JSON.stringify(existingData, null, 2));

  console.log("New submission:", newEntry);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}\nSubmitted at: ${newEntry.submittedAt}`,
    });
    console.log("Email sent successfully!");
  } catch (err) {
    console.error("Email sending error:", err.message);
  }

  res.json({ success: true, message: "Form submitted successfully!", data: newEntry });
});

app.get("/api/submissions", (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE));
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Server running -> http://localhost:${PORT}`);
});