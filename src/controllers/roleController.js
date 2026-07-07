/**
 * @file roleController.js
 * @description
 * This file contains the controller functions for managing user roles.
 * It handles the creation, retrieval, updating, and deletion of roles within the system.
 * It handles CRUD operations for roles.
 *
 * @overview
 * This controller provides the business logic for role management.
 * It interacts directly with the `Roles` model to perform CRUD operations.
 * It allows administrators to define different roles and their associated permissions. If an error occurs, it is thrown to be caught by `asyncHandler` and forwarded to the global `errorMiddleware`.
 *
 * Connections:
 *   ... -> requirePermission -> asyncHandler -> ROLECONTROLLER.JS -> Roles Model
 *   ROLECONTROLLER.JS -> (on error) -> asyncHandler -> errorMiddleware
 */
const Role = require("../models/Roles");
const ERR = require("../utils/errors.utils");

/**
 * @route   POST /api/roles/create
 * @desc    Create a new user role.
 * @access  Private
 */
exports.createRole = async (req, res) => {
  // Added isMedicalRole to destructuring
  const { roleName, rolePermissions, isMedicalRole } = req.body;

  if (!roleName) {
    throw ERR.invalidRequest("roleName is required", "ROLE_NAME_REQUIRED");
  }

  const existingRole = await Role.findOne({
    roleName: roleName.toUpperCase(),
  });
  if (existingRole) {
    throw ERR.conflict("Role already exists", "ROLE_ALREADY_EXISTS");
  }

  const newRole = await Role.create({
    roleName: roleName.toUpperCase(),
    rolePermissions: rolePermissions || [],
    isMedicalRole: isMedicalRole || false, // Added to creation
  });

  return res.status(201).json({
    success: true,
    message: "Role created successfully",
    data: newRole,
  });
};

/**
 * @route   GET /api/roles/show
 * @desc    Get all user roles.
 * @access  Private
 */
exports.getAllRoles = async (req, res) => {
  const roles = await Role.find({});
  return res.status(200).json({ success: true, data: roles });
};

/**
 * @route   PUT /api/roles/:id
 * @desc    Update an existing user role.
 * @access  Private
 */
exports.updateRole = async (req, res) => {
  const { id } = req.params;
  const { roleName, rolePermissions } = req.body;

  const role = await Role.findById(id);
  if (!role) throw ERR.notFound("Role not found", "ROLE_NOT_FOUND");

  if (roleName) role.roleName = roleName.toUpperCase();
  if (rolePermissions) role.rolePermissions = rolePermissions;

  await role.save();

  return res.status(200).json({
    success: true,
    message: "Role updated successfully",
    data: role,
  });
};

/**
 * @route   DELETE /api/roles/:id
 * @desc    Delete a user role.
 * @access  Private
 */
exports.deleteRole = async (req, res) => {
  const { id } = req.params;
  const deletedRole = await Role.findByIdAndDelete(id);
  if (!deletedRole) throw ERR.notFound("Role not found", "ROLE_NOT_FOUND");

  return res
    .status(200)
    .json({ success: true, message: "Role deleted successfully" });
};
