const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");
const { getMe } = require("../controllers/profileController");
const validate = require("../middlewares/validate");
const requirePermission = require("../middlewares/permissionMiddleware");

router.get(
  "/me",
  authenticateToken,
  requirePermission("VIEW_SELF"),
  asyncHandler(getMe),
);

module.exports = router;
