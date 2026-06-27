const express = require("express");
const router = express.Router();

const { body } = require("express-validator");
const validate = require("../middlewares/validate");
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

/* VALIDATION */
const roleValidation = [
  body("role_id").notEmpty().withMessage("Role ID is required").isNumeric().withMessage("Role ID must be a number"),
  body("role_name").notEmpty().withMessage("Role name is required"),
  body("role_permissions").optional().isArray().withMessage("Permissions must be an array"),
];

router.post("/", auth, checkPermission(PERMISSIONS.ROLE_MANAGE), roleValidation, validate, createRole);
router.get("/", auth,checkPermission(PERMISSIONS.ROLE_MANAGE), getAllRoles);
router.get("/:id", auth,checkPermission(PERMISSIONS.ROLE_MANAGE),getRoleById);
router.put("/:id", auth, checkPermission(PERMISSIONS.ROLE_MANAGE), roleValidation, validate, updateRole);
router.delete("/:id", auth, checkPermission(PERMISSIONS.ROLE_MANAGE), deleteRole);

module.exports = router;