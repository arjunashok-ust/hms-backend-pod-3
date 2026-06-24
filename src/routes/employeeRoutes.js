const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");
const employeeController = require("../controllers/employeeController");
const { signUpByAdmin } = require("../controllers/authController");
const requirePermission = require("../middlewares/permissionMiddleware");

router.get(
  "/all",
  authenticateToken,
  requirePermission("VIEW_EMPLOYEES"),
  asyncHandler(employeeController.getAllEmployees),
);
router.post(
  "/create",
  authenticateToken,
  requirePermission("CREATE_EMPLOYEE"),
  asyncHandler(signUpByAdmin),
);
router.put(
  "/:id",
  authenticateToken,
  requirePermission("UPDATE_EMPLOYEE"),
  asyncHandler(employeeController.updateEmployee),
);
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("DELETE_EMPLOYEE"),
  asyncHandler(employeeController.deleteEmployee),
);
router.patch(
  "/approve/:id",
  authenticateToken,
  requirePermission("APPROVE_EMPLOYEE"),
  asyncHandler(employeeController.approveEmployee),
);

router.patch(
  "/reject/:id",
  authenticateToken,
  requirePermission("REJECT_EMPLOYEE"),
  asyncHandler(employeeController.rejectEmployee),
);

module.exports = router;
