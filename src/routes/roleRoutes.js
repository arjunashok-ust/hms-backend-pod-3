const express = require("express");
const router = express.Router();
const asyncHandler = require("../middlewares/asyncHandler");
const roleController = require("../controllers/roleController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const requirePermission = require("../middlewares/permissionMiddleware");

router.post(
  "/create",
  authenticateToken,
  requirePermission("CREATE_NODES"),
  asyncHandler(roleController.createRole),
);
router.get(
  "/show",
  authenticateToken,
  requirePermission("VIEW_NODES"),
  asyncHandler(roleController.getAllRoles),
);
router.put(
  "/:id",
  authenticateToken,
  requirePermission("UPDATE_NODES"),
  asyncHandler(roleController.updateRole),
);
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("DELETE_NODES"),
  asyncHandler(roleController.deleteRole),
);

module.exports = router;
