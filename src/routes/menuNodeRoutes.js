const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const asyncHandler = require("../middlewares/asyncHandler");
const { authenticateToken } = require("../middlewares/authMiddleware");

const menuController = require("../controllers/menuNodeController");

router.post(
  "/createMenuNode",
  authenticateToken,
  validate,
  asyncHandler(menuController.createMenuNode),
);

router.delete(
  "/deleteMenuNode/:id",
  authenticateToken,
  validate,
  asyncHandler(menuController.deleteMenuNode),
);
router.get(
  "/getMenus",
  authenticateToken,
  asyncHandler(menuController.getMenus),
);
router.get(
  "/check-permission/:path",
  authenticateToken,
  asyncHandler(menuController.checkPermission),
);

module.exports = router;
