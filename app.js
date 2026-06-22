require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./src/config/db");
const errorMiddleware = require("./src/middlewares/error.middleware.js"); // see filename note below

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

const employeeRoutes = require("./src/routes/employeeRoutes");
const appointmentRoutes = require("./src/routes/appointmentRoutes");
const patientAppRoutes = require("./src/routes/patientAppRoutes");
const patientRoutes = require("./src/routes/patientRoutes");
const medicalRecordRoutes = require("./src/routes/medicalRecordRoutes");
const nodeRoutes = require("./src/routes/node.routes");
const roleRoutes = require("./src/routes/roles.routes");

app.use("/api/patientApp", patientAppRoutes);
app.use("/api/emp", employeeRoutes);
app.use("/api/appointment", appointmentRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/medical-record", medicalRecordRoutes);
app.use("/api/node", nodeRoutes);
app.use("/api/role", roleRoutes);

app.get("/", (req, res) => res.json({ message: "API running" }));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

app.use(errorMiddleware);

connectDB();

module.exports = app;