const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");

const {
  signup,
  login,
  currentUser,
} = require("../controllers/employeeController");

const signUpValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .matches(/^[A-Za-z\s]+$/)
    .withMessage("Name should contain only alphabets and spaces"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Valid email required"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least 1 uppercase letter"),

  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone number must contain exactly 10 digits"),

  body("role")
    .isIn([
      "admin",
      "doctor",
      "receptionist",
      "cashier",
      "nurse",
      "lab_tech",
      "pharmacist",
    ])
    .withMessage("Invalid role"),

  body("department").notEmpty().withMessage("Department is required"),

  body("designation").notEmpty().withMessage("Designation is required"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
];

router.post("/signup", signUpValidation, validate, signup);
router.post("/login", loginValidation, validate, login);
router.get("/currentUser", auth, currentUser);

module.exports = router;
