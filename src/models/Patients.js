/**
 * @file Patients.js
 * @description
 * This file defines the Mongoose schema and model for patients.
 *
 * @overview
 * This schema represents a patient within the Hospital Management System.
 * It stores essential demographic data, contact information, and basic medical details like blood group and allergies.
 * A pre-save hook automatically generates a unique Universal Hospital ID (`UHID`) for each new patient using the `generateID` utility.
 * This model is referenced by several other models, including `Users`, `Appointments`, and `MedicalRecords`, to link data to a specific patient.
 *
 * Connections:
 *   [patientController, authController, etc.] -> PATIENTS.JS
 *   PATIENTS.JS -> generateID.js (utility)
 */
const mongoose = require("mongoose");
const generateId = require("../utils/generateID");

const patientSchema = new mongoose.Schema(
  {
    UHID: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    dob: { type: Date, required: true },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      default: null,
    },
    allergies: [
      {
        type: String,
      },
    ],
    emergencyContact: { type: String },
    status: {
      type: String,
      enum: [
        "ACTIVE",
        "INACTIVE",
        "PASSWORD_CHANGE_PENDING",
        "ADMIN_APPROVAL_PENDING",
        "DELETED",
      ],
    },
    address: {
      line1: { type: String, required: true },
      line2: { type: String },
      state: { type: String, required: true },
      pincode: { type: Number, required: true },
    },
  },
  { timestamps: true },
);

patientSchema.pre("save", async function () {
  if (this.isNew) {
    this.UHID = await generateId("patient", "UHID");
  }
});

module.exports = mongoose.model("Patients", patientSchema);
