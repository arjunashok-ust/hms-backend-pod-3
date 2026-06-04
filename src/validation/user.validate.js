const { query } = require("express-validator");

const validateGetUserProfile = [
  query("email")
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email format"),
];

module.exports = { validateGetUserProfile };
