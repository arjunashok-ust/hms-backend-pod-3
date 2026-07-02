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
