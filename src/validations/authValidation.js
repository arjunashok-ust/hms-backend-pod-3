const { body } = require("express-validator");

exports.signupValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("A valid email is required")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[\W_]/)
    .withMessage("Password must contain at least one special character"),

  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .toUpperCase()
    .isIn(['OWNER', 'ADMIN', 'DOCTOR', 'RECEPTIONIST', 'CASHIER', 'NURSE', 'LAB_TECH', 'PHARMACIST'])
    .withMessage("Invalid role"),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .isMobilePhone('en-IN')
    .withMessage("Enter a valid phone number"),

  body("department")
    .trim()
    .toUpperCase()
    .notEmpty()
    .withMessage("Department is required")
    .isIn(["OPD", "IPD", "LAB", "PHARMACY", "ADMIN"])
    .withMessage("Provide valid department"),

  body("designation")
    .trim()
    .notEmpty()
    .withMessage("Designation is required"),

  body("joiningDate")
    .notEmpty()
    .withMessage("Joining date is required")
    .isISO8601()
    .withMessage("Joining date must be a valid date (YYYY-MM-DD)")
    .toDate()
];

exports.loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("A valid email is required")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
];