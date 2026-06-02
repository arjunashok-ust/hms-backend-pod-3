require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./src/config/db");

// app => server object
const app = express();
// Used for secure http headers
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

//middleware which logs requests
app.use(morgan("dev"));
// Read JSON data sent from frontend/Postman and make it available in req.body.
app.use(express.json());
app.get("/", (req, res) => res.json({ message: "API running" }));

const authRoutes = require("./src/routes/authRoutes");
app.use("/api/auth", authRoutes);

const userRoutes = require("./src/routes/userRoutes");
app.use("/api/users", userRoutes);

const adminRoutes = require("./src/routes/adminRoutes");
app.use("/api/admin", adminRoutes);

const patientRoutes = require("./src/routes/patientRoutes");
app.use("/api/patients", patientRoutes);

const appointmentRoutes = require("./src/routes/appointmentRoutes");
app.use("/api/appointment", appointmentRoutes);

const nodeRoutes = require("./src/routes/nodeRoutes");
app.use("/api/nodes", nodeRoutes);

connectDB();

module.exports = app;
