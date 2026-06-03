const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const authMiddleware = require("../middlewares/auth.middleware");
const { validateSignUp, loginValidation, validateResetPassword, validateRefreshToken,
    validateSetPassword, validateVerifyMail } = require("../validations/auth.validation");
const { employeeSignup, login, setPassword, verifyEmail } = require("../controllers/auth.controller");

router.post("/employeesignup", validateSignUp, validate, employeeSignup);
router.post("/login", loginValidation, validate, login);
router.get("/verifyemail", validateVerifyMail, validate, verifyEmail);
router.post("/setpassword", validateSetPassword, validate, setPassword);

module.exports = router;