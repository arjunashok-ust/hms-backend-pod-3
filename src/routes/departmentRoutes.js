/**
 * @file departmentRoutes.js
 * @description
 * This file defines the API routes for department management.
 *
 * @overview
 * This router handles all CRUD (Create, Read, Update, Delete) operations for hospital departments.
 * It uses middleware to ensure that only authenticated users with the correct permissions can perform these actions.
 * A typical request flows through: API Request -> DEPARTMENTROUTES.JS -> authenticateToken -> requirePermission -> asyncHandler -> departmentController -> Departments Model.
 * Any errors are caught by `asyncHandler` and passed to the global `errorMiddleware`.
 *
 * Connections:
 *   API Request -> DEPARTMENTROUTES.JS -> [authenticateToken, requirePermission] -> asyncHandler -> departmentController -> Departments Model
 */
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");
const requirePermission = require("../middlewares/permissionMiddleware");
const departmentController = require("../controllers/departmentController");

router.post(
  "/",
  authenticateToken,
  requirePermission("CREATE_DEPARTMENT"),
  asyncHandler(departmentController.createDepartment),
);

router.get(
  "/",
  authenticateToken,
  asyncHandler(departmentController.getAllDepartments),
);

router.put(
  "/:id",
  authenticateToken,
  requirePermission("UPDATE_DEPARTMENT"),
  asyncHandler(departmentController.updateDepartment),
);

router.delete(
  "/:id",
  authenticateToken,
  requirePermission("DELETE_DEPARTMENT"),
  asyncHandler(departmentController.deleteDepartment),
);

module.exports = router;
