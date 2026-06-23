const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "ACTIVE",
        "INACTIVE",
        "PASSWORD_CHANGE_PENDING",
        "ADMIN_APPROVAL_PENDING",
      ],
    },
    role: {
      type: String,
      enum: [
        "OWNER",
        "ADMIN",
        "DOCTOR",
        "RECEPTIONIST",
        "CASHIER",
        "CASHIER",
        "NURSE",
        "LAB_TECH",
        "PHARMACIST",
        "PATIENT",
        "SUPER_ADMIN"
      ],
      required: true,
    },
    employeeID: { type: String, ref: "Employees" },
    patientUHID: { type: String, ref: "Patients", default: null },
    lastLogin: { type: Date, default: null },
    isEmailVerified: { type: Boolean, default: false },
    verification_token: { type: String },
    verification_expiry: { type: Date },
    isCreatedByAdmin: { type: Boolean },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Users", userSchema);
