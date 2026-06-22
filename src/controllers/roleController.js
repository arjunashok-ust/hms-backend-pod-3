const Role = require("../models/Roles");

exports.createRole = async (req, res) => {
  try {
    const { roleName, rolePermissions } = req.body;

    if (!roleName) {
      return res
        .status(400)
        .json({ success: false, message: "roleName is required" });
    }

    const existingRole = await Role.findOne({
      roleName: roleName.toUpperCase(),
    });
    if (existingRole) {
      return res
        .status(400)
        .json({ success: false, message: "Role already exists" });
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
  } catch (error) {
    console.error("Create Role Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find({});
    return res.status(200).json({ success: true, data: roles });
  } catch (error) {
    console.error("Get Roles Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleName, rolePermissions } = req.body;

    const role = await Role.findById(id);
    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    if (roleName) role.roleName = roleName.toUpperCase();
    if (rolePermissions) role.rolePermissions = rolePermissions;

    await role.save();

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: role,
    });
  } catch (error) {
    console.error("Update Role Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRole = await Role.findByIdAndDelete(id);
    if (!deletedRole) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Role deleted successfully" });
  } catch (error) {
    console.error("Delete Role Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
