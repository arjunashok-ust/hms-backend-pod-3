/**
 * @file menuNodeRoutes.js
 * @description
 * This file defines the API routes for managing dynamic navigation menu nodes.
 *
 * @overview
 * This router provides endpoints for the CRUD operations on menu nodes, which are used to build the application's sidebar.
 * It also includes routes to fetch the menu for the current user and to check permissions for a given path.
 * A typical request flows through: API Request -> MENUNODEROUTES.JS -> authenticateToken -> requirePermission -> asyncHandler -> menuNodeController -> MenuNode Model.
 * Any errors are caught by `asyncHandler` and passed to the global `errorMiddleware`.
 *
 * Connections:
 *   API Request -> MENUNODEROUTES.JS -> [authenticateToken, requirePermission] -> asyncHandler -> menuNodeController -> MenuNode Model
 */
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const asyncHandler = require("../middlewares/asyncHandler");
const { authenticateToken } = require("../middlewares/authMiddleware");
const requirePermission = require("../middlewares/permissionMiddleware");

const menuController = require("../controllers/menuNodeController");

router.post(
  "/createMenuNode",
  authenticateToken,
  validate,
  requirePermission("CREATE_NODES"),
  asyncHandler(menuController.createMenuNode),
);

router.put(
  "/updateMenuNode/:id",
  authenticateToken,
  validate,
  requirePermission("UPDATE_NODES"),
  asyncHandler(menuController.updateMenuNode),
);

router.delete(
  "/deleteMenuNode/:id",
  authenticateToken,
  validate,
  requirePermission("DELETE_NODES"),
  asyncHandler(menuController.deleteMenuNode),
);
router.get(
  "/getSidebarMenu",
  authenticateToken,
  asyncHandler(menuController.getSidebarMenu),
);

router.get(
  "/getMenus",
  authenticateToken,
  requirePermission("VIEW_NODES"),
  asyncHandler(menuController.getMenus),
);
router.get(
  "/check-permission/:path",
  authenticateToken,
  asyncHandler(menuController.checkPermission),
);

module.exports = router;
