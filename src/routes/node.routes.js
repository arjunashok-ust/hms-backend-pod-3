const express = require("express");
const router = express.Router();

const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const checkPermission = require("../middlewares/checkPermission");
const PERMISSIONS = require("../constants/permissions");

const {
  createNode,
  getAllNodes,
  getNodeById,
  updateNode,
  deleteNode,
} = require("../controllers/node.controller");

/* VALIDATION */
const nodeValidation = [
  body("node_id").notEmpty().withMessage("Node ID is required").isNumeric().withMessage("Node ID must be a number"),
  body("name").notEmpty().withMessage("Name is required"),
  body("path").notEmpty().withMessage("Path is required"),
  body("role").isArray({ min: 1 }).withMessage("At least one role is required"),
  body("icon").notEmpty().withMessage("Icon is required"),
];

router.post("/", auth, checkPermission(PERMISSIONS.NODE_MANAGE), nodeValidation, validate, createNode);

router.get("/", auth, getAllNodes);
router.get("/:id", auth,checkPermission(PERMISSIONS.NODE_MANAGE), getNodeById);
router.put("/:id", auth, checkPermission(PERMISSIONS.NODE_MANAGE), nodeValidation, validate, updateNode);
router.delete("/:id", auth, checkPermission(PERMISSIONS.NODE_MANAGE), deleteNode);

module.exports = router;