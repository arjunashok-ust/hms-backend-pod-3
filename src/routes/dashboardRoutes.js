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
