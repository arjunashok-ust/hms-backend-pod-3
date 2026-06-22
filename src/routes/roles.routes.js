const express = require("express");
const router = express.Router();

const auth = require("../middlewares/authMiddleware");
const checkPermission = require("../middlewares/checkPermission");
const PERMISSIONS = require("../constants/permissions");

const {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
} = require("../controllers/role.controller");


router.post("/", auth, checkPermission(PERMISSIONS.ROLE_MANAGE), createRole);
router.get("/", auth,checkPermission(PERMISSIONS.ROLE_MANAGE), getAllRoles);
router.get("/:id", auth,checkPermission(PERMISSIONS.ROLE_MANAGE),getRoleById);
router.put("/:id", auth, checkPermission(PERMISSIONS.ROLE_MANAGE), updateRole);
router.delete("/:id", auth, checkPermission(PERMISSIONS.ROLE_MANAGE), deleteRole);

module.exports = router;