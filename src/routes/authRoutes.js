const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const authenticateToken = require("../middlewares/authMiddleware");
const {
    signupValidation,
    loginValidation } = require("../validations/authValidation")

const {
    signup,
    login
} = require("../controllers/authController");

router.post("/signup", signupValidation, validate, signup);
router.post("/login", loginValidation, validate, login);

module.exports = router;