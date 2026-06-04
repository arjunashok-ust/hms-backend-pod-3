const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const auth = require("../middleware/authMiddileware");

const { signup, login, currentUser } = require("../controllers/authController");

const signupValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .matches(/^[A-Za-z\s]+$/)
    .withMessage("Name should contain only alphabets and spaces"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
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
    .isIn([
      "ADMIN",
      "DOCTOR",
      "RECEPTIONIST",
      "CASHIER",
      "NURSE",
      "LAB_TECH",
      "PHARMACIST",
    ])
    .withMessage("Invalid role"),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .customSanitizer((value) => value.replaceAll(/\s+/g, ""))
    .isMobilePhone("en-IN")
    .withMessage("Enter a valid phone number"),

  body("department").notEmpty().withMessage("Invalid department"),

  body("designation").notEmpty().withMessage("Designation is required"),

  body("joiningDate").notEmpty().withMessage("Joining date is required").isISO8601()
      .withMessage("Invalid date format"),

  body("specialization")
    .optional()
    .notEmpty()
    .withMessage("Specialization cannot be empty"),

  body("qualification")
    .optional()
    .isArray()
    .withMessage("Qualification must be an array"),

  body("availabilitySlots")
    .optional()
    .isArray()
    .withMessage("Availability slots must be an array"),
];

const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email required")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

router.post("/signup", signupValidation, validate, signup);
router.post("/login", loginValidation, validate, login);
router.get("/me", auth, currentUser);
module.exports = router;
