const Role = require("../models/Roles");
const ERR = require("../utils/errors.utils");

exports.createRole = async (req, res) => {
  const { roleName, rolePermissions } = req.body;

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
  });

  return res.status(201).json({
    success: true,
    message: "Role created successfully",
    data: newRole,
  });
};

exports.getAllRoles = async (req, res) => {
  const roles = await Role.find({});
  return res.status(200).json({ success: true, data: roles });
};

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

exports.deleteRole = async (req, res) => {
  const { id } = req.params;
  const deletedRole = await Role.findByIdAndDelete(id);
  if (!deletedRole) throw ERR.notFound("Role not found", "ROLE_NOT_FOUND");

  return res
    .status(200)
    .json({ success: true, message: "Role deleted successfully" });
};
