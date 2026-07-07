/**
 * @file roleRoutes.js
 * @description
 * This file defines the API routes for managing user roles.
 *
 * @overview
 * This router handles all CRUD operations for user roles.
 * It uses middleware to ensure that only authenticated users with the appropriate permissions can manage roles.
 * A typical request flows through: API Request -> ROLEROUTES.JS -> authenticateToken -> requirePermission -> asyncHandler -> roleController -> Roles Model.
 * Any errors are caught by `asyncHandler` and passed to the global `errorMiddleware`.
 *
 * Connections:
 *   API Request -> ROLEROUTES.JS -> [authenticateToken, requirePermission] -> asyncHandler -> roleController -> Roles Model
 */
const express = require("express");
const router = express.Router();
const asyncHandler = require("../middlewares/asyncHandler");
const roleController = require("../controllers/roleController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const requirePermission = require("../middlewares/permissionMiddleware");

router.post(
  "/create",
  authenticateToken,
  requirePermission("CREATE_ROLES"),
  asyncHandler(roleController.createRole),
);
router.get(
  "/show",
  authenticateToken,
  requirePermission("VIEW_ROLES"),
  asyncHandler(roleController.getAllRoles),
);
router.get("/public", asyncHandler(roleController.getPublicRoles));
router.put(
  "/:id",
  authenticateToken,
  requirePermission("UPDATE_ROLES"),
  asyncHandler(roleController.updateRole),
);
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("DELETE_ROLES"),
  asyncHandler(roleController.deleteRole),
);

module.exports = router;
