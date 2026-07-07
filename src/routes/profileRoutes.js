/**
 * @file profileRoutes.js
 * @description
 * This file defines the API route for fetching the current user's profile.
 *
 * @overview
 * This router contains a single protected endpoint for a user to retrieve their own profile information.
 * It uses authentication and permission middleware to secure the route.
 * The request flows through: API Request -> PROFILEROUTES.JS -> authenticateToken -> requirePermission -> asyncHandler -> profileController -> [Users, Employees] Models.
 * Any errors are caught by `asyncHandler` and passed to the global `errorMiddleware`.
 *
 * Connections:
 *   API Request -> PROFILEROUTES.JS -> [authenticateToken, requirePermission] -> asyncHandler -> profileController -> [Users, Employees] Models
 */
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");
const { getMe } = require("../controllers/profileController");
const validate = require("../middlewares/validate");
const requirePermission = require("../middlewares/permissionMiddleware");

router.get(
  "/me",
  authenticateToken,
  requirePermission("VIEW_SELF"),
  asyncHandler(getMe),
);

module.exports = router;
