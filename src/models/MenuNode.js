const mongoose = require("mongoose");

const menuNodeSchema = new mongoose.Schema({
  name: String,
  key: String,
  path: String,
  icon: String,
  rolesAllowed: [String],
  order: Number,
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("MenuNode", menuNodeSchema);
