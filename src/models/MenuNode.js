/**
 * @file MenuNode.js
 * @description
 * This file defines the Mongoose schema and model for navigation menu nodes.
 *
 * @overview
 * This schema represents a single item in the application's dynamic navigation menu (e.g., a sidebar link).
 * It stores properties like the display name, path, icon, and the roles that are allowed to see the menu item.
 * The `order` property is used to sort the menu items for display.
 * This model is used by the `menuNodeController` to build role-based navigation menus.
 *
 * Connections:
 *   menuNodeController -> MENUNODE.JS
 */
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
