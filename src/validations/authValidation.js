const { body } = require("express-validator");
const Roles = require("../models/Roles");

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

exports.loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("A valid email is required")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];

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
