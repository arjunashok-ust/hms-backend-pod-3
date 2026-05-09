require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
// const { swaggerUi, swaggerDocument } = require("./swagger/swagger");

const app = express();
// Used for secure http
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

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes)

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

module.exports = app;
