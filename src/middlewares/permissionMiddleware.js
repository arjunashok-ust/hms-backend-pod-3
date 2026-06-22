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
