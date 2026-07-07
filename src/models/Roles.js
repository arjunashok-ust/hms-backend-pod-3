/**
 * @file Roles.js
 * @description
 * This file defines the Mongoose schema and model for user roles.
 *
 * @overview
 * This schema represents a user role within the system, such as 'ADMIN', 'DOCTOR', or 'PATIENT'.
 * Each role contains an array of permission strings that define its access rights.
 * The `isMedicalRole` flag helps distinguish clinical roles from administrative or patient roles.
 * A pre-save hook automatically generates a unique `roleId` for each new role using a utility.
 *
 * Connections:
 *   [roleController, permissionController] -> ROLES.JS
 *   ROLES.JS -> generateID.js (utility)
 */
const mongoose = require("mongoose");
const generateId = require("../utils/generateID");

const roleSchema = new mongoose.Schema({
  roleId: { type: String },
  roleName: { type: String, required: true },
  rolePermissions: [{ type: String }],
  isMedicalRole: { type: Boolean, default: false },
});

roleSchema.pre("save", async function () {
  if (this.isNew) {
    this.roleId = await generateId("role", "ROLE");
  }
});

module.exports = mongoose.model("Roles", roleSchema);
