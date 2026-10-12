const Role = require('../models/role.model');
const ERR = require('../utils/errors.utils');

const permission = (...requiredPermissions) => {
    return async (req, res, next) => {
        try {
            const role = await Role.findOne({ role_name: req.user.role });
            if (!role) {
                return res.status(400).json({ message: "Role not found." });
            }

            const userPermission = role.role_permissions;

            const hasPermission = requiredPermissions.some((permission) => {
                return userPermission.includes(permission);
            })
            if (!hasPermission) {
                throw ERR.accessDenied();
            }
            next();
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ message: "Access Denied" });
        }
    }
}

module.exports = permission;