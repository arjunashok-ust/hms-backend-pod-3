const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate.middleware");
const { validateSignUp, loginValidation } = require("../validations/auth.validation");
const { signUp, login } = require("../controllers/auth.controller");

router.post("/signup", validateSignUp, validate, signUp);
router.post("/login", loginValidation, validate, login);

module.exports = router;