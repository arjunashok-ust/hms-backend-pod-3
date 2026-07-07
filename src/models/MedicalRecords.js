/**
 * @file MedicalRecords.js
 * @description
 * This file defines the Mongoose schema and model for patient medical records.
 *
 * @overview
 * This schema represents a single medical record associated with a patient visit.
 * It stores critical clinical information, including diagnosis, symptoms, medications, and observations.
 * The schema establishes relationships by referencing the `Appointments`, `Patients`, and `Employees` (for the doctor) models.
 * A pre-save hook automatically generates a unique `recordCode` for each new record using a utility.
 * It also includes indexes to optimize queries for records by patient, doctor, and appointment.
 *
 * Connections:
 *   medicalRecordController -> MEDICALRECORDS.JS
 *   MEDICALRECORDS.JS -> generateID.js (utility)
 */
const mongoose = require("mongoose");
const generateId = require("../utils/generateID");

const medicalRecordSchema = new mongoose.Schema(
  {
    recordCode: { type: String },
    doctorEmployeeId: { type: String, required: true },
    appointmentId: { type: String, required: true },
    patientId: { type: String, required: true },
    visitDate: { type: Date, default: Date.now },
    diagnosis: { type: String },
    complaint: { type: String },
    symptoms: { type: String },
    medications: [
      {
        name: { type: String },
        dosage: { type: String },
        frequency: { type: String },
        duration: { type: String },
        deliveryMethod: { type: String },
      },
    ],
    medicalObservations: [
      {
        metricName: { type: String },
        metricValue: { type: String },
        recordedTime: { type: Date, default: Date.now },
      },
    ],
    notes: { type: String },
    createdBy: { type: String },
    updatedBy: { type: String },
    status: {
      type: String,
      enum: ["FINAL", "DRAFT", "DELETED"],
      default: "DRAFT",
    },
  },
  { timestamps: true },
);

medicalRecordSchema.pre("save", async function () {
  if (this.isNew) {
    this.recordCode = await generateId("medicalRecord", "REC");
  }
});

medicalRecordSchema.index({ recordCode: 1 }, { unique: true });
medicalRecordSchema.index({ appointmentId: 1 });
medicalRecordSchema.index({ patientId: 1, visitDate: -1 });
medicalRecordSchema.index({ doctorEmployeeId: 1, visitDate: -1 });

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
