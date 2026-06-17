const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authMiddleware");
const employeeController = require("../controllers/employeeController");
const { signUpByAdmin } = require("../controllers/authController");
const requirePermission = require("../middlewares/permissionMiddleware");

router.get("/all", authenticateToken,requirePermission("VIEW_EMPLOYEES"), employeeController.getAllEmployees);
router.post("/create", authenticateToken,requirePermission("CREATE_EMPLOYEE"), signUpByAdmin);
router.put(
  "/:id",
  authenticateToken,
  requirePermission("UPDATE_EMPLOYEE"),
  employeeController.updateEmployee,
);
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("DELETE_EMPLOYEE"),
  employeeController.deleteEmployee,
);
router.patch(
  "/approve/:id",
  authenticateToken,
  requirePermission("APPROVE_EMPLOYEE"),
  employeeController.approveEmployee,
);

module.exports = router;
