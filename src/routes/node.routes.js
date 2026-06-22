const express = require("express");
const router = express.Router();

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


router.post("/", auth, checkPermission(PERMISSIONS.NODE_MANAGE), createNode);
/* Any authenticated user needs this to build their own sidebar menu. */
router.get("/", auth, getAllNodes);
router.get("/:id", auth,checkPermission(PERMISSIONS.NODE_MANAGE), getNodeById);
router.put("/:id", auth, checkPermission(PERMISSIONS.NODE_MANAGE), updateNode);
router.delete("/:id", auth, checkPermission(PERMISSIONS.NODE_MANAGE), deleteNode);

module.exports = router;