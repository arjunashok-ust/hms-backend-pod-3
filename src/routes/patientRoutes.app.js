const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const auth=require("../middleware/authMiddleware");
const roleValidation=require("../middleware/roleMiddleware");
const {
  patientSignup,
  patientLogin,
  updatePatientProfile,
} = require("../controller/patientAppController");
const patientSignupValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  body("name").trim().notEmpty().withMessage("Name is required"),

  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[0-9]{10}$/)
    .withMessage("Invalid phone number"),

  body("gender")
    .notEmpty()
    .withMessage("Gender is required")
    .isIn(["Male", "Female", "Other"])
    .withMessage("Invalid gender"),

  body("date_of_birth").notEmpty().withMessage("Date of birth is required"),

  body("bloodGroup")
    .notEmpty()
    .withMessage("Blood group is required")
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("Invalid blood group"),

  body("emergencyContact")
    .notEmpty()
    .withMessage("Emergency contact is required")
    .matches(/^[0-9]{10}$/)
    .withMessage("Invalid emergency contact number"),
  body("address.line1").notEmpty().withMessage("Address line is required"),
  body("address.city").notEmpty().withMessage("City is required"),
  body("address.postcode").notEmpty().withMessage("Postcode is required"),
];

//LOGIN VALIDATION
const patientLoginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email"),

  body("password").notEmpty().withMessage("Password is required"),
];

router.post("/signup", patientSignupValidation, validate, patientSignup);
router.post("/login", patientLoginValidation, validate, patientLogin);
//router.put("/updateProfile",auth,roleValidation("patient"),updatePatientProfile);
module.exports=router;
 