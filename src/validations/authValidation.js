/**
 * @file authValidation.js
 * @description
 * This file contains validation rules (`express-validator` chains) for authentication and user registration endpoints.
 *
 * @overview
 * These validation chains are used as middleware in route definitions to ensure incoming request data is well-formed before it reaches the controller.
 *
 * Connections:
 *   API Request -> route -> AUTHVALIDATION.JS -> validate -> ...
 */

const { body } = require("express-validator");
const Roles = require("../models/Roles");

/**
 * @description Validation chain for employee self-signup (`/api/auth/signupByUser`).
 * Validates fields required for an employee to register themselves, including checks for
 * email, password complexity, role, and other profile details.
 */
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
    .custom(async (value) => {
      const role = await Roles.findOne({ roleName: value });
      if (!role) {
        throw new Error("Invalid role");
      }
    }),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .customSanitizer((value) => value.replaceAll(/\s+/g, ""))
    .isMobilePhone("en-IN")
    .withMessage("Enter a valid phone number"),

  body("department").trim().notEmpty().withMessage("Department is required"),

  body("designation").trim().notEmpty().withMessage("Designation is required"),

  body("qualification")
    .trim()
    .notEmpty()
    .withMessage("qualification is required"),

  body("specialization")
    .if(body("role").toUpperCase().equals("DOCTOR"))
    .trim()
    .notEmpty()
    .withMessage("Specialization is required for doctors"),

  body("consultationFee")
    .if(body("role").toUpperCase().equals("DOCTOR"))
    .notEmpty()
    .withMessage("Consultation fees is required for doctors")
    .isNumeric()
    .withMessage("Consultation fees must be a number"),

  body("weeklySchedule")
    .if(body("role").toUpperCase().equals("DOCTOR"))
    .isArray({ min: 1 })
    .withMessage("Availability slots are required for doctors"),

  body("joiningDate")
    .notEmpty()
    .withMessage("Joining date is required")
    .isISO8601()
    .withMessage("Joining date must be a valid date (YYYY-MM-DD)")
    .toDate(),
];

/**
 * @description Validation chain for user login (`/api/auth/login`).
 * Ensures that email and password are provided and that the email is in a valid format.
 */
exports.loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("A valid email is required")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];

/**
 * @description Validation chain for the forgot password request (`/api/auth/forgot-password`).
 * Validates that a valid email is provided in the request body.
 */
exports.forgotPasswordValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("A valid email is required")
    .normalizeEmail(),
];

/**
 * @description Validation chain for changing/setting a new password (`/api/auth/setpassword`).
 * Enforces strong password complexity rules to ensure user security.
 */
exports.changePasswordValidation = [
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
];

/**
 * @description Validation chain for patient self-signup (`/api/patients/mobile-register`).
 * Validates all necessary patient demographic, contact, and address information required
 * for a new patient to register through a client like a mobile app.
 */
exports.patientSignupValidation = [
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

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .customSanitizer((value) => value.replaceAll(/\s+/g, ""))
    .isMobilePhone("en-IN")
    .withMessage("Enter a valid phone number"),

  body("gender")
    .notEmpty()
    .withMessage("Gender is required")
    .isIn(["Male", "Female", "Other"])
    .withMessage("Gender must be Male, Female, or Other"),

  body("dob")
    .notEmpty()
    .withMessage("Date of birth is required")
    .isISO8601()
    .withMessage("Date of birth must be a valid date (YYYY-MM-DD)")
    .toDate(),

  body("address.line1")
    .trim()
    .notEmpty()
    .withMessage("Address Line 1 is required")
    .escape(),

  body("address.line2").optional().trim().escape(),

  body("address.state")
    .trim()
    .notEmpty()
    .withMessage("State is required")
    .escape(),

  body("address.pincode")
    .notEmpty()
    .withMessage("Pincode is required")
    .isInt()
    .withMessage("Pincode must be a number")
    .isLength({ min: 6, max: 6 })
    .withMessage("Pincode must be exactly 6 digits"),
];

/**
 * @description Validation chain for an admin creating a new patient account (`/api/patients/create`).
 * Validates the core information required for an administrator to create a patient profile
 * on their behalf.
 */
exports.patientSignupByAdminValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("A valid email is required")
    .normalizeEmail(),

  body("dob")
    .notEmpty()
    .withMessage("Date of birth is required")
    .isISO8601()
    .withMessage("Date of birth must be a valid date (YYYY-MM-DD)")
    .toDate(),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .customSanitizer((value) => value.replaceAll(/\s+/g, ""))
    .isMobilePhone("en-IN")
    .withMessage("Enter a valid phone number"),

  body("address.state")
    .trim()
    .notEmpty()
    .withMessage("State is required")
    .escape(),

  body("address.line1")
    .trim()
    .notEmpty()
    .withMessage("Address Line 1 is required")
    .escape(),

  body("address.line2").optional().trim().escape(),

  body("address.pincode")
    .notEmpty()
    .withMessage("Pincode is required")
    .isInt()
    .withMessage("Pincode must be a number")
    .isLength({ min: 6, max: 6 })
    .withMessage("Pincode must be exactly 6 digits"),

  body("gender")
    .notEmpty()
    .withMessage("Gender is required")
    .isIn(["Male", "Female", "Other"])
    .withMessage("Gender must be Male, Female, or Other"),
];

/**
 * @description Validation chain for a patient updating their own profile (`/api/patients/:id`).
 * All fields are optional to allow for partial updates. If a field is provided, it is
 * validated against its expected format (e.g., phone number, date, pincode).
 */
exports.patientSelfUpdate = [
  body("phone")
    .trim()
    .optional()
    .customSanitizer((value) => value.replaceAll(/\s+/g, ""))
    .isMobilePhone("en-IN")
    .withMessage("Enter a valid phone number"),

  body("gender")
    .optional()
    .isIn(["Male", "Female", "Other"])
    .withMessage("Gender must be Male, Female, or Other"),

  body("dob")
    .optional()
    .isISO8601()
    .withMessage("Date of birth must be a valid date (YYYY-MM-DD)")
    .toDate(),

  body("address.line1").optional().escape(),

  body("address.line2").optional().trim().escape(),

  body("address.state").optional().escape(),

  body("address.pincode")
    .optional()
    .isInt()
    .withMessage("Pincode must be a number")
    .isLength({ min: 6, max: 6 })
    .withMessage("Pincode must be exactly 6 digits"),
];
