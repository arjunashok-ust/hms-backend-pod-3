/**
 * @file menuNodeController.js
 * @description This file contains the controller functions for managing the application's navigation menu nodes.
 * @description
 * This file contains controller functions for managing navigation menu nodes.
 *
 * @overview
 * This controller is called from a route handler after authentication and permission middleware have passed.
 * It contains the core business logic for managing the application's dynamic navigation menu, including CRUD operations and role-based filtering.
 * It interacts with the MenuNode Model. If an error occurs, it is thrown to be caught by `asyncHandler` and forwarded to the global `errorMiddleware`.
 *
 * Connections:
 *   ... -> requirePermission -> asyncHandler -> MENUNODECONTROLLER.JS -> MenuNode Model
 *   MENUNODECONTROLLER.JS -> (on error) -> asyncHandler -> errorMiddleware
 */
const MenuNode = require("../models/MenuNode");
const ERR = require("../utils/errors.utils");

const normalizeRoles = (roles) =>
  Array.isArray(roles)
    ? roles.map((role) =>
        typeof role === "string" ? role.trim().toUpperCase() : role,
      )
    : [];

const escapeRegex = (value) =>
  value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

/**
 * @route   POST /api/menu/createMenuNode
 * @desc    Create a new menu node item.
 * @access  Private
 */
exports.createMenuNode = async (req, res) => {
  const { name, key, path, icon, parentId, rolesAllowed, order } = req.body;

  if (!name || !path || !icon) {
    throw ERR.invalidRequest(
      "name, path and icon are required",
      "MENU_NODE_REQUIRED_FIELDS",
    );
  }

  const existing = await MenuNode.findOne({ $or: [{ key }, { path }] });
  if (existing) {
    throw ERR.conflict(
      "Menu with same key or path already exists",
      "MENU_NODE_CONFLICT",
    );
  }

  const menuNode = new MenuNode({
    name,
    key,
    path,
    icon,
    parentId: parentId || null,
    rolesAllowed: normalizeRoles(rolesAllowed),
    order: order || 0,
    isActive: true,
  });

  await menuNode.save();

  return res.status(201).json({
    message: "Menu node created successfully",
    data: menuNode,
  });
};

/**
 * @route   DELETE /api/menu/deleteMenuNode/:id
 * @desc    Delete a menu node item.
 * @access  Private
 */
exports.deleteMenuNode = async (req, res) => {
  const { id } = req.params;

  const menuNode = await MenuNode.findById(id);
  if (!menuNode)
    throw ERR.notFound("Menu node not found", "MENU_NODE_NOT_FOUND");

  const children = await MenuNode.find({ parentId: id });
  if (children.length > 0) {
    throw ERR.invalidRequest(
      "Cannot delete menu node with child items. Delete children first.",
      "MENU_NODE_HAS_CHILDREN",
    );
  }

  await MenuNode.findByIdAndDelete(id);

  return res.json({ message: "Menu node deleted successfully" });
};

/**
 * @route   GET /api/menu/getSidebarMenu
 * @desc    Get the sidebar menu items accessible to the current user's role.
 * @access  Private
 */
exports.getSidebarMenu = async (req, res) => {
  const userRole = req.user.role?.toUpperCase();
  if (!userRole) {
    throw ERR.invalidRequest(
      "User role is required to generate sidebar menu",
      "USER_ROLE_REQUIRED",
    );
  }

  const normalizedRole = escapeRegex(userRole);
  const accessibleNodes = await MenuNode.find({
    isActive: true,
    rolesAllowed: { $in: [new RegExp(`^${normalizedRole}$`, "i")] },
  }).sort({ order: 1 });

  return res.status(200).json({ success: true, menuItems: accessibleNodes });
};

/**
 * @route   GET /api/menu/getMenus
 * @desc    Get all menu nodes for management purposes.
 * @access  Private
 */
exports.getMenus = async (req, res) => {
  try {
    // If the request URL has ?all=true, fetch everything. Otherwise, only fetch active.
    const fetchAll = req.query.all === "true";
    const filter = fetchAll ? {} : { isActive: true };

    const menus = await MenuNode.find(filter).sort({ order: 1 });

    res.status(200).json(menus);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching menu nodes", error: error.message });
  }
};

/**
 * @route   GET /api/menu/check-permission/:path
 * @desc    Check if the current user has permission to access a given route path.
 * @access  Private
 */
exports.checkPermission = async (req, res) => {
  const { path } = req.params;
  const { role } = req.user;
  const searchPath = path.startsWith("/") ? path : `/${path}`;

  const node = await MenuNode.findOne({ path: searchPath });
  if (!node) {
    return res.json({ allowed: false, message: "Route not defined" });
  }

  const normalizedRole = role?.toUpperCase();
  const isAllowed = (node.rolesAllowed || []).some(
    (allowedRole) => allowedRole?.toUpperCase() === normalizedRole,
  );
  res.json({ allowed: isAllowed });
};

/**
 * @route   PUT /api/menu/updateMenuNode/:id
 * @desc    Update an existing menu node item.
 * @access  Private
 */
exports.updateMenuNode = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedNode = await MenuNode.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true },
    );

    if (!updatedNode)
      return res.status(404).json({ message: "Menu node not found" });
    res.status(200).json({
      success: true,
      data: updatedNode,
      message: "Node updated successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating menu node", error: error.message });
  }
};
