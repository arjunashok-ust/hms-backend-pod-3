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

connectDB();

module.exports = app;
