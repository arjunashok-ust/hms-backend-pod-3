const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const authMiddleware = require("../middlewares/auth.middleware");
const { signUp, login, profile } = require("../controllers/auth.controller");

router.post("/signup", validate, signUp);
router.post("/login", validate, login);
router.get("/profile", authMiddleware, validate, profile);

module.exports = router;