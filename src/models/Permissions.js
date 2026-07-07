/**
 * @file Permissions.js
 * @description
 * This file defines the Mongoose schema and model for application permissions.
 *
 * @overview
 * This schema represents a single, granular permission that can be assigned to a role.
 * Permissions are used for fine-grained access control throughout the application.
 * A pre-save hook automatically derives a `group` name from the permission name (e.g., 'USER' from 'USER_CREATE').
 * This grouping helps organize permissions in the UI.
 *
 * Connections:
 *   permissionController -> PERMISSIONS.JS
 */
const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    group: {
      type: String,
      default: "Custom",
    },
  },
  { timestamps: true },
);

permissionSchema.pre("save", function () {
  if (this.isModified("name")) {
    this.group = this.name.split("_")[0];
  }
});

module.exports = mongoose.model("Permissions", permissionSchema);
