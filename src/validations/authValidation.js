const { body } = require("express-validator");
const medicalRoles = new Set(["DOCTOR", "NURSE", "PHARMACIST", "LAB_TECH"]);

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
    .isIn([
      "OWNER",
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
    .isMobilePhone("en-IN")
    .customSanitizer((value) => value.replaceAll(/\s+/g, ""))
    .withMessage("Enter a valid phone number"),

  body("department")
    .trim()
    .toUpperCase()
    .notEmpty()
    .withMessage("Department is required")
    .isIn(["OPD", "IPD", "LAB", "PHARMACY", "ADMIN"])
    .withMessage("Provide valid department"),

  body("designation").trim().notEmpty().withMessage("Designation is required"),

  body("joiningDate")
    .notEmpty()
    .withMessage("Joining date is required")
    .isISO8601()
    .withMessage("Joining date must be a valid date (YYYY-MM-DD)")
    .toDate(),

  body("consultationFee").custom((value, { req }) => {
    if (req.body.role === "DOCTOR") {
      if (value === undefined || value === null || value === "") {
        throw new Error("Consultation fee is required for doctors.");
      }
      if (Number.isNaN(Number(value)) || Number(value) < 0) {
        throw new Error("Consultation fee must be a valid positive number.");
      }
    } else if (value !== undefined && value !== "") {
      throw new Error("Consultation fee must only be provided by doctors.");
    }
    return true;
  }),

  body("weeklySchedule").custom((value, { req }) => {
    if (req.body.role === "DOCTOR") {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error("Weekly schedule is required for doctors.");
      }
    } else if (
      value !== undefined &&
      (Array.isArray(value) ? value.length > 0 : value !== "")
    ) {
      throw new Error("Weekly schedule must only be provided by doctors.");
    }
    return true;
  }),

  body("medicalRegistrationNo").custom((value, { req }) => {
    const isMedicalRole = medicalRoles.has(req.body.role);
    if (isMedicalRole && !value) {
      throw new Error(
        `Medical registration number is required for role: ${req.body.role}.`,
      );
    }
    if (!isMedicalRole && value) {
      throw new Error(
        "Medical registration number must not be provided for non-medical roles.",
      );
    }
    return true;
  }),

  body("specialization").custom((value, { req }) => {
    const isMedicalRole = medicalRoles.has(req.body.role);
    if (isMedicalRole && !value) {
      throw new Error(`Specialization is required for role: ${req.body.role}.`);
    }
    if (!isMedicalRole && value) {
      throw new Error(
        "Specialization must not be provided for non-medical roles.",
      );
    }
    return true;
  }),

  body("qualification").notEmpty().withMessage("Qualification is required"),
];

exports.loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("A valid email is required")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];
