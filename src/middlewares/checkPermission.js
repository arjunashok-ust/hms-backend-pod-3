const Role = require("../models/Role");
const checkPermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user?.role) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: please log in again",
        });
      }

      const roleDoc = await Role.findOne({ role_name: req.user.role }).select(
        "role_permissions",
      );

      if (!roleDoc) {
        return res.status(403).json({
          success: false,
          message: "Access denied: role not recognized",
        });
      }

      const hasAllPermissions = requiredPermissions.every((perm) =>
        roleDoc.role_permissions.includes(perm),
      );

      if (!hasAllPermissions) {
        return res.status(403).json({
          success: false,
          message: "Access denied: insufficient permissions for this action",
        });
      }

      // optional: attach for controller-level use (e.g. conditional fields in response)
      req.userPermissions = roleDoc.permissions;

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Permission validation failed",
        error: error.message,
      });
    }
  };
};

module.exports = checkPermission;
