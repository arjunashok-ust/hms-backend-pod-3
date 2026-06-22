/**
 * Role-based access control middleware.
 *
 * Usage:
 *   router.post("/route", auth, roleValidation("admin", "receptionist"), handler);
 *
 * Must run AFTER `auth` middleware, since it relies on req.user being set.
 * Expects req.user.role to be a string (e.g. "admin", "super_admin", "patient").
 */

const roleValidation = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: user role not found, please log in again",
        });
      }

      const userRole = req.user.role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied: '${userRole}' role is not permitted to perform this action`,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Role validation failed",
        error: error.message,
      });
    }
  };
};

module.exports = roleValidation;