const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const authenticateToken = require("../middlewares/authMiddleware");
const {
    signupValidation,
    loginValidation } = require("../validations/authValidation")

const {
    signup,
    login,
    me
} = require("../controllers/authController");

router.post("/signup", signupValidation, validate, signup);
router.post("/login", loginValidation, validate, login);
router.get("/me", authenticateToken, me);

module.exports = router;