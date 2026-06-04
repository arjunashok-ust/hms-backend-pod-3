require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const db = require("./config/db");
const authRouter = require("./routes/auth.route");
const userRouter = require("./routes/user.route");

const app = express();
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

db.connectDB();

app.get("/", (req, res) => res.json({ message: "API Running " }));

app.use("/hms/auth", authRouter);
app.use("/hms/user", userRouter);

module.exports = app;