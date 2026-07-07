/**
 * @file app.js
 * @description
 * This is the main application setup file for the Express server.
 * It configures middleware, mounts all API routes, and establishes the database connection.
 *
 * @overview
 * This file is the core of the Express application. It initializes the server, sets up essential security (`helmet`, `cors`) and logging (`morgan`) middleware, and configures body/cookie parsers.
 * It then imports and mounts all the individual route handlers under their respective API prefixes.
 * Finally, it registers the global `errorMiddleware` which acts as the final destination for all operational errors, and it initiates the connection to the MongoDB database.
 *
 * Connections:
 *   server.js -> APP.JS
 *   APP.JS -> (Middleware: helmet, cors, morgan, express.json, cookieParser)
 *   APP.JS -> (All Route Files: authRoutes, appointmentRoutes, etc.) -> (Controllers)
 *   APP.JS -> errorMiddleware.js
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
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
app.use(cookieParser());

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

const verifyEmailRoutes = require("./routes/emailVerificationRoutes");
app.use("/api/email", verifyEmailRoutes);

const roleRoutes = require("./routes/roleRoutes");
app.use("/api/roles", roleRoutes);

const permissionRoutes = require("./routes/permissionRoutes");
app.use("/api/permissions", permissionRoutes);

const medicalRecordRoutes = require("./routes/medicalRecordRoutes");
app.use("/api/records", medicalRecordRoutes);

const departmentRoutes = require("./routes/departmentRoutes");
app.use("/api/departments", departmentRoutes);

const errorMiddleware = require("./middlewares/errorMiddleware");
app.use(errorMiddleware);

try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");
} catch (err) {
  console.error("MongoDB connection error:", err);
  process.exit(1);
}

module.exports = app;
