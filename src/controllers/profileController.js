 other files missed/**
 * @file profileController.js
 * @description
 * This file contains controller functions for managing the currently authenticated user's profile.
 * This file contains functions for managing the authenticated user's profile.
 *
 * @overview
 * This controller provides endpoints for a user to retrieve their own profile information.
 * It identifies the user based on the email attached to the request by authentication middleware.
 * It interacts with the `Users` and `Employees` models to fetch the complete user and profile data. If an error occurs, it is thrown to be caught by `asyncHandler` and forwarded to the global `errorMiddleware`.
 *
 * Connections:
 *   ... -> requirePermission -> asyncHandler -> PROFILECONTROLLER.JS -> [Users, Employees] Models
 *   PROFILECONTROLLER.JS -> (on error) -> asyncHandler -> errorMiddleware
 */
const Users = require("../models/Users");
const Employees = require("../models/Employees");
const ERR = require("../utils/errors.utils");

/**
 * @route   (No route defined in context)
 * @desc    Deletes the current user's profile. NOTE: This function has incorrect logic and duplicates getMe.
 * @access  Private
 */
exports.deleteProfile = async (req, res) => {
  const user = await Users.findOne({ email: req.user.email }).select(
    "-__v -passwordHash",
  );
  if (!user) throw ERR.userNotFound();

  const profile = await Employees.findOne({ email: req.user.email }).select(
    "-__v",
  );
  if (!profile) throw ERR.profileNotFound();

  res.status(200).json({ user: profile });
};

/**
 * @route   GET /api/profile/me
 * @desc    Get the profile of the currently authenticated user.
 * @access  Private
 */
exports.getMe = async (req, res) => {
  const user = await Users.findOne({ email: req.user.email }).select(
    "-__v -passwordHash",
  );
  if (!user) throw ERR.userNotFound();

  const profile = await Employees.findOne({ email: req.user.email }).select(
    "-__v",
  );
  if (!profile) throw ERR.profileNotFound();

  res.status(200).json({ user: profile });
};
