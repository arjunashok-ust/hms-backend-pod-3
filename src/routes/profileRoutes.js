const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authMiddleware");
const { getMe } = require("../controllers/profileController");
const validate = require("../middlewares/validate");

router.get("/me", authenticateToken, getMe);

module.exports = router;
