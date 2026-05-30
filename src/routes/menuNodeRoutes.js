const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const { authenticateToken } = require("../middlewares/authMiddleware");

const menuController = require("../controllers/menuNodeController");

router.post(
  "/createMenuNode",
  authenticateToken,
  validate,
  menuController.createMenuNode,
);

router.delete(
  "/deleteMenuNode/:id",
  authenticateToken,
  validate,
  menuController.deleteMenuNode,
);
router.get("/getMenus", authenticateToken, menuController.getMenus);
router.get(
  "/check-permission/:path",
  authenticateToken,
  menuController.checkPermission,
);

module.exports = router;
