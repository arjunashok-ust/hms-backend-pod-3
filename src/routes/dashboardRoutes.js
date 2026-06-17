const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authMiddleware");
const dashboardController = require("../controllers/dashboardController");
const requirePermission = require("../middlewares/permissionMiddleware");

router.get(
  "/stats",
  authenticateToken,
  requirePermission("VIEW_EMPLOYEE_STATS"),
  dashboardController.getDashboardStats,
);
router.get(
  "/tenEmployees",
  authenticateToken,
  requirePermission("VIEW_EMPLOYEE_STATS"),
  dashboardController.getEmployeeOverview,
);

module.exports = router;
