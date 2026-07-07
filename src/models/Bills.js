/**
 * @file Bills.js
 * @description
 * This file defines the Mongoose schema and model for managing patient bills.
 *
 * @overview
 * This schema represents a bill within the Hospital Management System.
 * It includes details such as the patient, associated appointment, a list of billable items, the total amount, and payment status.
 * It establishes relationships with the `Patients`, `Appointments`, and `Employees` models using ObjectId references.
 *
 * Connections:
 *   (Controllers) -> BILLS.JS
 *   BILLS.JS -> generateID.js (utility)
 */
const mongoose = require("mongoose");
const generateId = require("../utils/generateID");

const billSchema = new mongoose.Schema(
  {
    billCode: { type: String, unique: true },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patients",
      required: true,
    },
    appointmentID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointments",
    },
    items: [
      {
        serviceName: String,
        amount: Number,
      },
    ],
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "PARTIAL"],
      default: "Pending",
    },

    createdByEmployeeID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employees",
    },
  },
  {
    timestamps: { createdAt: "createdAt" },
  },
);

billSchema.pre("save", async function () {
  if (this.isNew) {
    this.billCode = await generateId("bill", "BILL");
  }
});

module.exports = mongoose.model("Bills", billSchema);
