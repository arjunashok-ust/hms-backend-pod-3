/**
 * @file generateID.js
 * @description
 * This file provides a utility function to generate unique, prefixed, and padded sequential IDs.
 *
 * @overview
 * The `generateId` function is an asynchronous utility that produces unique identifiers.
 * It uses a `Counter` model to maintain a persistent, auto-incrementing sequence for different document types (e.g., 'patient', 'employee').
 * It takes a sequence name and a prefix, finds or creates the corresponding counter, increments it, and returns a formatted ID like 'PREFIX-000001'.
 *
 * Connections:
 *   [Appointments, Bills, etc.] Models (pre-save hook) -> GENERATEID.JS -> Counter Model
 */
const Counter = require("../models/Counter");

async function generateId(sequenceName, prefix) {
  const counter = await Counter.findOneAndUpdate(
    { name: sequenceName },
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true },
  );
  return `${prefix}-${String(counter.seq).padStart(6, "0")}`;
}

module.exports = generateId;
