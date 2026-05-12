const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const authMiddleware = require("../middlewares/auth.middleware");
const { validateSignUp, loginValidation } = require("./route.validation");
const { signUp, login, profile, adminDelete } = require("../controllers/auth.controller");

router.post("/signup", validateSignUp, validate, signUp);
router.post("/login", loginValidation, validate, login);
router.get("/profile", authMiddleware, validate, profile);

module.exports = router;