/**
 * @file permissionRoutes.js
 * @description
 * This file defines the API routes for managing permissions and their assignment to roles.
 *
 * @overview
 * This router provides endpoints for creating, viewing, assigning, and revoking permissions.
 * It uses middleware to ensure that only authorized administrators can manage the access control system.
 * A typical request flows through: API Request -> PERMISSIONROUTES.JS -> authenticateToken -> requirePermission -> asyncHandler -> permissionController -> [Permissions, Roles] Models.
 * Any errors are caught by `asyncHandler` and passed to the global `errorMiddleware`.
 *
 * Connections:
 *   API Request -> PERMISSIONROUTES.JS -> [authenticateToken, requirePermission] -> asyncHandler -> permissionController -> [Permissions, Roles] Models
 */
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
