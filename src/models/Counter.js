/**
 * @file Counter.js
 * @description
 * This file defines the Mongoose schema and model for a generic counter.
 *
 * @overview
 * This schema creates a simple counter in the database.
 * It is used by the `generateID` utility to produce unique, sequential numbers for different document types (like employees, patients, etc.).
 * Each document type gets its own counter record, identified by the `name` field.
 *
 * Connections:
 *   generateID.js (utility) -> COUNTER.JS
 */
const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Counter", counterSchema);
