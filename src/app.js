import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Logging
app.use(morgan("dev"));

// JSON parser
app.use(express.json());

app.get("/", (req, res) => res.json({ message: "API running" }));

app.use("/api/auth", authRoutes);

// ✅ Top-level await instead of .then().catch()
try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");
} catch (err) {
  console.error("MongoDB connection error:", err.message);
  process.exit(1);
}

export default app;