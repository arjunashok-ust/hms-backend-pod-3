/**
 * @file dashboardRoutes.js
 * @description
 * This file defines the API routes for fetching dashboard statistics.
 *
 * @overview
 * This router provides endpoints for retrieving aggregated data for the main application dashboard.
 * It secures the routes using authentication and permission-checking middleware.
 * A typical request flows through: API Request -> DASHBOARDROUTES.JS -> authenticateToken -> requirePermission -> asyncHandler -> dashboardController -> Model(s).
 * Any errors are caught by `asyncHandler` and passed to the global `errorMiddleware`.
 *
 * Connections:
 *   API Request -> DASHBOARDROUTES.JS -> [authenticateToken, requirePermission] -> asyncHandler -> dashboardController -> [Employees, Users, Appointments] Models
 */
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");
const dashboardController = require("../controllers/dashboardController");
const requirePermission = require("../middlewares/permissionMiddleware");

router.get(
  "/stats",
  authenticateToken,
  requirePermission("VIEW_EMPLOYEE_STATS"),
  asyncHandler(dashboardController.getDashboardStats),
);
router.get(
  "/tenEmployees",
  authenticateToken,
  requirePermission("VIEW_EMPLOYEE_STATS"),
  asyncHandler(dashboardController.getEmployeeOverview),
);

module.exports = router;
