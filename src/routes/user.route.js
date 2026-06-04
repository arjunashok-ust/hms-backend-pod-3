const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate.middleware");
const authMiddleware = require("../middlewares/auth.middleware");
const { profile } = require("../controllers/user.controller");

router.get("/profile", authMiddleware, validate, profile);

module.exports = router;