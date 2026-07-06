const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const asyncHandler = require("../middlewares/asyncHandler");
const { authenticateToken } = require("../middlewares/authMiddleware");
const {
  signupValidation,
  loginValidation,
  changePasswordValidation,
  forgotPasswordValidation,
} = require("../validations/authValidation");

const {
  signupByUser,
  login,
  changeFirstPassword,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

router.post(
  "/signupByUser",
  signupValidation,
  validate,
  asyncHandler(signupByUser),
);
router.post("/login", loginValidation, validate, asyncHandler(login));
router.post("/refresh", asyncHandler(refreshAccessToken));
router.post("/logout", asyncHandler(logout));
router.post(
  "/setpassword",
  changePasswordValidation,
  validate,
  asyncHandler(changeFirstPassword),
);
router.post(
  "/forgot-password",
  forgotPasswordValidation,
  validate,
  asyncHandler(forgotPassword),
);
router.get("/reset-password", asyncHandler(resetPassword));

module.exports = router;
