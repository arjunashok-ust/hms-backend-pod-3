/**
 * @file emailVerificationRoutes.js
 * @description
 * This file defines the API route for email verification.
 *
 * @overview
 * This router provides a public endpoint that users access by clicking a link in a verification email.
 * It triggers the logic in the `verifyEmailController` to validate the token and activate the user's email.
 * The request flows through: API Request -> EMAILVERIFICATIONROUTES.JS -> asyncHandler -> verifyEmailController -> Users Model.
 * Any errors are caught by `asyncHandler` and passed to the global `errorMiddleware`.
 *
 * Connections:
 *   API Request -> EMAILVERIFICATIONROUTES.JS -> asyncHandler -> verifyEmailController -> Users Model
 */
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const asyncHandler = require("../middlewares/asyncHandler");

const { verifyEmail } = require("../controllers/verifyEmailController");
router.get("/verify-email", asyncHandler(verifyEmail));

module.exports = router;
