/**
 * @file Appointments.js
 * @description
 * This file defines the Mongoose schema and model for appointments.
 *
 * @overview
 * This schema represents an appointment within the Hospital Management System.
 * It captures essential details like the patient, doctor, date, time slot, and current status.
 * The schema establishes relationships with other parts of the system by referencing the `Patients` and `Employees` models.
 * It includes a pre-save hook that automatically generates a unique `appointmentCode` for every new appointment record.
 *
 * Connections:
 *   appointmentController -> APPOINTMENTS.JS
 *   APPOINTMENTS.JS -> generateID.js (utility)
 */
const mongoose = require("mongoose");
const generateId = require("../utils/generateID");

const appointmentsSchema = new mongoose.Schema(
  {
    appointmentCode: { type: String, unique: true },
    patientId: {
      type: String,
      ref: "Patients",
      required: true,
    },
    doctorEmployeeID: {
      type: String,
      ref: "Employees",
      required: true,
    },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled", "Pending"],
      default: "Pending",
    },
    createdByEmployeeID: { type: String, ref: "Employees" },
  },
  { timestamps: true },
);

appointmentsSchema.pre("save", async function () {
  if (this.isNew) {
    this.appointmentCode = await generateId("appointment", "APT");
  }
});

module.exports = mongoose.model("Appointments", appointmentsSchema);
