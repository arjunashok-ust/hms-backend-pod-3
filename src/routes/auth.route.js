const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const authMiddleware = require("../middlewares/auth.middleware");
const { validateSignUp, loginValidation, validateResetPassword, validateRefreshToken,
    validateSetPassword, validateVerifyMail } = require("../validations/auth.validation");
const { employeeSignup, login, setPassword, refresh, resetPassword, 
        verifyEmail } = require("../controllers/auth.controller");

router.post("/employeesignup", validateSignUp, validate, employeeSignup);
router.post("/login", loginValidation, validate, login);
router.get("/verifyemail",  validateVerifyMail, validate, verifyEmail);
router.post("/setpassword", validateSetPassword, validate, setPassword);
router.post("/refresh", authMiddleware, validateRefreshToken, validate, refresh);
router.post("/resetpassword", authMiddleware, validateResetPassword, validate, resetPassword);

module.exports = router;