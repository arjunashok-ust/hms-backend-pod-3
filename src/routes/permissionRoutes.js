const express = require("express");
const router = express.Router();
const permissionController = require("../controllers/permissionController");
const asyncHandler = require("../middlewares/asyncHandler");
const { authenticateToken } = require("../middlewares/authMiddleware");
const requirePermission = require("../middlewares/permissionMiddleware");

router.post(
  "/",
  authenticateToken,
  requirePermission("CREATE_PERMISSIONS"),
  asyncHandler(permissionController.createPermission),
);
router.get(
  "/",
  authenticateToken,
  requirePermission("VIEW_PERMISSIONS"),
  asyncHandler(permissionController.getAllPermissions),
);
router.post(
  "/assign",
  authenticateToken,
  requirePermission("UPDATE_PERMISSIONS"),
  asyncHandler(permissionController.assignPermissionToRole),
);
router.post(
  "/revoke",
  authenticateToken,
  requirePermission("UPDATE_PERMISSIONS"),
  asyncHandler(permissionController.revokePermissionFromRole),
);

module.exports = router;
