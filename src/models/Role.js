const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  role_id: { type: Number, required: true, unique: true },
  role_name: { type: String, required: true, unique: true },
  role_permissions: [{ type: String }],
});

module.exports = mongoose.model("roles", roleSchema);