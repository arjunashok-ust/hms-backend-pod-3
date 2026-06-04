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
      "lab_Tech",
      "pharmacist",
    ])
    .withMessage("Invalid role"),

  body("department").notEmpty().withMessage("Department is required"),

  body("designation").notEmpty().withMessage("Designation is required"),

  // MEDICAL REGISTRATION NUMBER
  body("medicalRegistrationNo")
    .if((value, { req }) =>
      ["doctor", "nurse", "lab_Tech", "pharmacist"].includes(req.body.role),
    )
    .notEmpty()
    .withMessage("Medical Registration Number is required"),

  // SPECIALIZATION (DOCTOR ONLY)
  body("specialization")
    .if((value, { req }) => req.body.role === "doctor")
    .notEmpty()
    .withMessage("Specialization is required"),

  // AVAILABILITY SLOTS (DOCTOR ONLY)
  body("availabilitySlots")
    .if((value, { req }) => req.body.role === "doctor")
    .isArray({ min: 1 })
    .withMessage("Availability slots are required for doctors"),
];

const loginValidation = [
  body("email")
    .notEmpty()
    .withMessage("Email is required.")
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage("Invalid email format"),
  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 8 })
    .withMessage("Password must contain atleast 8 characters."),
];

router.post("/signup", signUpValidation, validate, signup);
router.post("/login", loginValidation, validate, login);
router.get("/currentUser", auth, currentUser);

module.exports = router;
