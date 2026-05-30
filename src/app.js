require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(morgan("dev"));
app.use(express.json());

app.get("/", (req, res) => res.json({ message: "API running" }));

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const profileRoutes = require("./routes/profileRoutes");
app.use("/api/profile", profileRoutes);

const appointmentRoutes = require("./routes/appointmentRoutes");
app.use("/api/appointment", appointmentRoutes);

const menuNodeRoutes = require("./routes/menuNodeRoutes");
app.use("/api/menuNode", menuNodeRoutes);

const dashboardRoutes = require("./routes/dashboardRoutes");
app.use("/api/dashboard", dashboardRoutes);

const employeeRoutes = require("./routes/employeeRoutes");
app.use("/api/employees", employeeRoutes);

const patientRoutes = require("./routes/patientRoutes");
app.use("/api/patients", patientRoutes);

try {
  mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");
} catch (err) {
  console.error("MongoDB connection error:", err.message);
  process.exit(1);
}

module.exports = app;
