/**
 * @file permissionController.js
 * @description
 * This file contains the controller functions for managing permissions.
 * It handles creating new permissions and assigning or revoking them from roles.
 * It handles creating, assigning, and revoking permissions from roles.
 *
 * @overview
 * This controller manages the business logic for role-based access control permissions.
 * It provides endpoints to create new permission records in the database.
 * It also allows for dynamically assigning and revoking permissions from existing roles.
 * The controller interacts with the `Permissions` and `Roles` models to perform these operations.
 *
 * Connections:
 *   ... -> requirePermission -> asyncHandler -> PERMISSIONCONTROLLER.JS -> [Permissions, Roles] Models
 *   PERMISSIONCONTROLLER.JS -> (on error) -> asyncHandler -> errorMiddleware
 */
const Permissions = require("../models/Permissions");
const Roles = require("../models/Roles");
const ERR = require("../utils/errors.utils");

/**
 * @route   POST /api/permissions
 * @desc    Create a new permission.
 * @access  Private
 */
exports.createPermission = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    throw ERR.invalidRequest("Permission name is required.");
  }

  const existingPermission = await Permissions.findOne({ name });
  if (existingPermission) {
    throw ERR.invalidRequest(`Permission '${name}' already exists.`);
  }

  const newPermission = new Permissions({ name });
  await newPermission.save();

  res.status(201).json({
    success: true,
    message: "Permission created successfully.",
    permission: newPermission,
  });
};

/**
 * @route   GET /api/permissions
 * @desc    Get all permissions, grouped by category.
 * @access  Private
 */
exports.getAllPermissions = async (req, res) => {
  const permissions = await Permissions.find({}).sort({ group: 1, name: 1 });

  const groupedPermissions = permissions.reduce((acc, permission) => {
    const group = permission.group || "General";
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(permission);
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    permissions: groupedPermissions,
  });
};

/**
 * @route   POST /api/permissions/assign
 * @desc    Assign a permission to a role.
 * @access  Private
 */
exports.assignPermissionToRole = async (req, res) => {
  const { roleId, permissionName } = req.body;
  const role = await Roles.findOneAndUpdate(
    { roleId },
    { $addToSet: { rolePermissions: permissionName } },
    { new: true },
  );
  if (!role) throw ERR.notFound("Role not found.");
  res
    .status(200)
    .json({ success: true, message: "Permission assigned.", role });
};

/**
 * @route   POST /api/permissions/revoke
 * @desc    Revoke a permission from a role.
 * @access  Private
 */
exports.revokePermissionFromRole = async (req, res) => {
  const { roleId, permissionName } = req.body;
  const role = await Roles.findOneAndUpdate(
    { roleId },
    { $pull: { rolePermissions: permissionName } },
    { new: true },
  );
  if (!role) throw ERR.notFound("Role not found.");
  res.status(200).json({ success: true, message: "Permission revoked.", role });
};
