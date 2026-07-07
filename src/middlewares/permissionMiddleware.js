/**
 * @file permissionMiddleware.js
 * @description
 * This file contains the middleware for checking user permissions against route requirements.
 *
 * @overview
 * This module exports a higher-order function, `requirePermission`.
 * This function generates an Express middleware tailored to specific permission requirements.
 * It inspects the `permissions` array on the `req.user` object, which is populated by the authentication middleware.
 * The middleware can be configured to require either at least one permission from a list (`requireAll: false`) or all of them (`requireAll: true`).
 * If the user's permissions are insufficient, it halts the request and returns a 403 Forbidden error.
 *
 * Connections:
 *   API Request -> route -> authenticateToken -> PERMISSIONMIDDLEWARE.JS -> [validate | asyncHandler]
 */
const requirePermission = (requiredPermissions, requireAll = false) => {
  return (req, res, next) => {
    const userPermissions = req.user.permissions || [];

    const permsToCheck = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    const hasAccess = requireAll
      ? permsToCheck.every((p) => userPermissions.includes(p))
      : permsToCheck.some((p) => userPermissions.includes(p));

    if (hasAccess) {
      return next();
    }

    const logicWord = requireAll ? "and" : "or";
    const permsString = permsToCheck.join(`' ${logicWord} '`);

    return res.status(403).json({
      success: false,
      message: `Access Denied: You lack the required permission(s) ('${permsString}') to perform this action.`,
      errorCode: "FORBIDDEN",
    });
  };
};

module.exports = requirePermission;
