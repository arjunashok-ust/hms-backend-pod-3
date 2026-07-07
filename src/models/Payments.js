/**
 * @file Payments.js
 * @description
 * This file defines the Mongoose schema and model for payment transactions.
 *
 * @overview
 * This schema represents a single payment transaction made against a bill.
 * It captures the payment amount, method, and the employee who received it.
 * It establishes a direct relationship with the `Bills` model to link a payment to a specific bill.
 * A pre-save hook automatically generates a unique `paymentCode` for each new payment record using a utility.
 *
 * Connections:
 *   (Controllers) -> PAYMENTS.JS
 *   PAYMENTS.JS -> generateID.js (utility)
 */
const mongoose = require("mongoose");
const generateId = require("../utils/generateID");

const paymentSchema = new mongoose.Schema(
  {
    paymentCode: { type: String, unique: true },
    billID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bills",
      required: true,
      unique: true,
    },
    amount: { type: Number, required: true },
    method: {
      type: String,
      enum: ["CASH", "CARD", "UPI"],
      required: true,
    },
    paidAt: {
      type: Date,
    },
    receivedByEmployeeID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employees",
    },
  },
  { timestamps: true },
);

paymentSchema.pre("save", async function () {
  if (this.isNew) {
    this.paymentCode = await generateId("payment", "PAY");
  }
});

module.exports = mongoose.model("Payments", paymentSchema);
