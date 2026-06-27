const Role = require('../models/Role');

exports.createRole = async (req, res) => {
    try {
        const { role_id, role_name, role_permissions } = req.body;

        const role = new Role({ role_id, role_name, role_permissions });
        const savedRole = await role.save();

        return res.status(201).json({
            success: true,
            message: 'Role created successfully',
            data: savedRole,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to create role',
            error: error.message,
        });
    }
};

exports.getAllRoles = async (req, res) => {
    try {
        const roles = await Role.find().sort({ role_id: 1 });

        return res.status(200).json({
            success: true,
            count: roles.length,
            data: roles,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch roles',
            error: error.message,
        });
    }
};

exports.getRoleById = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);

        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found',
            });
        }

        return res.status(200).json({
            success: true,
            data: role,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch role',
            error: error.message,
        });
    }
};

exports.updateRole = async (req, res) => {
    try {
        const { role_id, role_name, role_permissions } = req.body;

        const updatedRole = await Role.findByIdAndUpdate(
            req.params.id,
            { role_id, role_name, role_permissions },
            { new: true, runValidators: true }
        );

        if (!updatedRole) {
            return res.status(404).json({
                success: false,
                message: 'Role not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Role updated successfully',
            data: updatedRole,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update role',
            error: error.message,
        });
    }
};

exports.deleteRole = async (req, res) => {
    try {
        const deletedRole = await Role.findByIdAndDelete(req.params.id);

        if (!deletedRole) {
            return res.status(404).json({
                success: false,
                message: 'Role not found',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Role deleted successfully',
            data: deletedRole,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to delete role',
            error: error.message,
        });
    }
};
