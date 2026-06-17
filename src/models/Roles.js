const mongoose = require("mongoose");
const generateId = require("../utils/generateID");

const roleSchema = new mongoose.Schema({
  roleId: { type: String},
  roleName: { type: String, required: true },
  rolePermissions: [{ type: String }],
});

roleSchema.pre("save", async function () {
  if (this.isNew) {
    this.roleId = await generateId("role", "ROLE");
  }
});

module.exports = mongoose.model("Roles", roleSchema);
