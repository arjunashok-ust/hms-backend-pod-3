/**
 * @file authRoutes.js
 * @description
 * This file defines the API routes for user authentication and authorization.
 *
 * @overview
 * This router handles all authentication-related endpoints, such as user signup, login, password management, and token refreshing.
 * It uses `express-validator` for input validation (`signupValidation`, `loginValidation`, etc.) and custom middleware for processing.
 * A typical request flows through: API Request -> AUTHROUTES.JS -> validation (e.g., loginValidation) -> validate -> asyncHandler -> authController -> Model(s).
 * Any errors are caught by `asyncHandler` and passed to the global `errorMiddleware`.
 *
 * Connections:
 *   API Request -> AUTHROUTES.JS -> authValidation -> validate -> asyncHandler -> authController -> [Users, Employees, Patients, Roles] Models
 */
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
