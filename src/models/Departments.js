/**
 * @file Departments.js
 * @description
 * This file defines the Mongoose schema and model for hospital departments.
 *
 * @overview
 * This schema represents a department within the hospital.
 * It stores the department's name and a unique, system-generated ID.
 * A pre-save hook automatically generates a unique `departmentId` (e.g., "DEP-001") for each new department using the `generateID` utility.
 * The `departmentName` is used for validation in the `Employees` model to ensure data integrity.
 *
 * Connections:
 *   departmentController -> DEPARTMENTS.JS
 *   DEPARTMENTS.JS -> generateID.js (utility)
 */
const mongoose = require("mongoose");
const generateId = require("../utils/generateID");

const departmentSchema = new mongoose.Schema({
  departmentId: { type: String },
  departmentName: { type: String, required: true },
});

departmentSchema.pre("save", async function () {
  if (this.isNew) {
    this.departmentId = await generateId("department", "DEP");
  }
});

module.exports = mongoose.model("Departments", departmentSchema);
