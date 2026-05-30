const express = require("express");
const router = express.Router();
const {authenticateToken} = require("../middlewares/authMiddleware"); 
const dashboardController = require("../controllers/dashboardController");

router.get("/stats", authenticateToken, dashboardController.getDashboardStats);
router.get("/tenEmployees", authenticateToken, dashboardController.getEmployeeOverview);

module.exports = router;