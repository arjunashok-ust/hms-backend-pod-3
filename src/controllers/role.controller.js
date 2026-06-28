const Role = require("../models/Role");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

// @desc    Create a new role
// @route   POST /api/role
exports.createRole = asyncHandler(async (req, res) => {
  const { role_id, role_name, role_permissions } = req.body;

  const role = await new Role({ role_id, role_name, role_permissions }).save();

  return res
    .status(201)
    .json(new ApiResponse(201, "Role created successfully", role));
});

// @desc    Get all roles
// @route   GET /api/role
exports.getAllRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().sort({ role_id: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, "Roles fetched successfully", roles));
});

// @desc    Get a single role by id
// @route   GET /api/role/:id
exports.getRoleById = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);

  if (!role) {
    throw new ApiError(404, "Role not found", "ROLE_NOT_FOUND");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Role fetched successfully", role));
});

// @desc    Update a role by id
// @route   PUT /api/role/:id
exports.updateRole = asyncHandler(async (req, res) => {
  const { role_id, role_name, role_permissions } = req.body;

  const updatedRole = await Role.findByIdAndUpdate(
    req.params.id,
    { role_id, role_name, role_permissions },
    { new: true, runValidators: true }
  );

  if (!updatedRole) {
    throw new ApiError(404, "Role not found", "ROLE_NOT_FOUND");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Role updated successfully", updatedRole));
});

// @desc    Delete a role by id
// @route   DELETE /api/role/:id
exports.deleteRole = asyncHandler(async (req, res) => {
  const deletedRole = await Role.findByIdAndDelete(req.params.id);

  if (!deletedRole) {
    throw new ApiError(404, "Role not found", "ROLE_NOT_FOUND");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Role deleted successfully", deletedRole));
});
