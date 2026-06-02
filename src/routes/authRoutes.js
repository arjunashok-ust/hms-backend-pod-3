const express = require("express");
const router = express.Router();
const { body, query } = require("express-validator");
const validate = require("../middleware/validate");
const auth = require("../middleware/authMiddleware");
const rolevalidate = require("../middleware/roleMiddleware");

const { signup, formSignUp, verifyMail, login,resetPassword } = require("../controllers/authController");

const { adminSignupValidation, SignupValidation, loginValidation, resetPasswordValidation, verifyMailValidation } = require("../validations/authValidations");

router.post("/signup", auth, rolevalidate("ADMIN"), adminSignupValidation, validate, signup);
router.post("/formSignup", SignupValidation, validate, formSignUp);
router.post("/login", loginValidation, validate, login);
router.post('/reset-password',resetPasswordValidation, validate,resetPassword);
router.get("/verifyMail", verifyMailValidation, validate, verifyMail);



module.exports = router;