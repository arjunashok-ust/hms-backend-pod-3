const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authMiddleware");
const { getMe } = require("../controllers/profileController");
const validate = require("../middlewares/validate");
const requirePermission = require("../middlewares/permissionMiddleware");

router.get("/me", authenticateToken, requirePermission("VIEW_SELF"), getMe);

module.exports = router;
