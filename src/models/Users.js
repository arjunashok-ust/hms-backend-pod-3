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
    isCreatedByAdmin: { type: Boolean },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Users", userSchema);
