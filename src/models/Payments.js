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
