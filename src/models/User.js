const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    status: { type: Boolean, default: true },
    role: {
      type: String,
      enum: [
        "super_admin",
        "admin",
        "doctor",
        "receptionist",
        "cashier",
        "nurse",
        "lab_Tech",
        "pharmacist",
        "patient",
      ],
      required: true,
    },
    employeeId: { type: String },
    isFirstLogin: { type: Boolean, default: true },
    last_login: { type: Date, default: null },
    refreshTokenHash: { type: String, default: null },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

/* Hot lookup fields: role filters (e.g. find doctors) and employeeId joins
   used in every enrichment / currentUser / doctor-scope query. */
userSchema.index({ role: 1 });
userSchema.index({ employeeId: 1 });
module.exports = mongoose.model("User", userSchema);
