require("dotenv").config();
const express = require("express");
//const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");

const app = express();
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MOngoDB connected"))
.catch((err) => console.log("MongoDB connection error:", err.message));

app.get("/",(req, res) => res.json({message: "API Running "}));

const authRouter = require("./routes/auth.route");
app.use("/hms",authRouter);

module.exports = app;