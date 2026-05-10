const express = require("express");
const app = express();
app.use(express.json());
const authRoutes=require('./routes/authRoutes');
app.use("/api/auth",authRoutes);
module.exports = app;