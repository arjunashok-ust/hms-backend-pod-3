const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const authenticateToken = require("../middlewares/authMiddleware");
const {
  signupValidation,
  loginValidation,
} = require("../validations/authValidation");

const {
  signUpByAdmin,
  signupByUser,
  login,
  changeFirstPassword,
} = require("../controllers/authController");

router.post("/signUpByAdmin", signupValidation, validate, signUpByAdmin);
router.post("/signupByUser", signupValidation, validate, signupByUser);
router.post("/login", loginValidation, validate, login);
router.post("/setpassword", changeFirstPassword);

module.exports = router;
