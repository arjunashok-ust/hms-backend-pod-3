require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");

const db = require("./config/db.config");

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

const authRoute = require("./routes/auth.route");
const userRoute = require("./routes/user.route");

app.use("/auth", authRoute);
app.use("/user", userRoute);

app.use((req,res)=>{
  res.status(404).json({message: "Route not found!"})
});

module.exports = app;
