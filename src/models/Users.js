/**
 * @file Users.js
 * @description
 * This file defines the Mongoose schema and model for user accounts.
 *
 * @overview
 * This schema represents the core user account and authentication entity.
 * It stores the user's email, hashed password, role, and account status.
 * It also manages tokens for session management (refresh token) and security flows (email verification, password reset).
 * The schema links to an `Employees` or `Patients` profile based on the user's role.
 * An async validator ensures that the assigned `role` exists in the `Roles` collection, maintaining data integrity.
 *
 * Connections:
 *   [authController, employeeController, etc.] -> USERS.JS
 *   USERS.JS -> Roles.js (for validation)
 */
const mongoose = require("mongoose");
const Roles = require("./Roles");

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
        "DELETED",
      ],
    },
    role: {
      type: String,
      required: true,
      validate: {
        validator: async function (value) {
          const role = await Roles.findOne({ roleName: value });
          return !!role;
        },
        message: (props) => `${props.value} is not a valid role.`,
      },
    },
    employeeID: { type: String, ref: "Employees" },
    patientUHID: { type: String, ref: "Patients", default: null },
    refreshToken: { type: String, default: null },
    refreshTokenExpiry: { type: Date, default: null },
    lastLogin: { type: Date, default: null },
    isEmailVerified: { type: Boolean, default: false },
    verification_token: { type: String },
    verification_expiry: { type: Date },
    reset_token: { type: String, default: null },
    reset_expiry: { type: Date, default: null },
    reset_password_hash: { type: String, default: null },
    isCreatedByAdmin: { type: Boolean },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Users", userSchema);
