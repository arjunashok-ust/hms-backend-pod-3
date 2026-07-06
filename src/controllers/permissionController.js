const Permissions = require("../models/Permissions");
const Roles = require("../models/Roles");
const ERR = require("../utils/errors.utils");

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
