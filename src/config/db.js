/**
 * @file db.js
 * @description
 * This file provides a utility function to connect to the MongoDB database.
 *
 * @overview
 * This module exports a single asynchronous function, `connectDB`.
 * This function uses Mongoose to establish a connection to the MongoDB instance specified by the `MONGO_URI` environment variable.
 * It includes a check to prevent creating multiple connections if one is already established.
 * It is intended to be called once during application startup.
 *
 * Connections:
 *   app.js (startup) -> DB.JS -> MongoDB
 */
const mongoose = require("mongoose");

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  await mongoose.connect(process.env.MONGO_URI);
};
module.exports = connectDB;
