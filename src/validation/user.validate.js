const { body, query } = require('express-validator');

const validateGetUserProfile = [
    query('email').isEmail().withMessage('invalid email format'),
];

const validateGetNameByEmployeeId = [
    query('employeeId').notEmpty().withMessage('Employee Id Is Required'),
]

const validateGetNameByPatientId = [
    query('patientId').notEmpty().withMessage('Patient Id Is Required'),
]

const validateCreatePatient = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required.")
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage("Name must contain only letters and spaces"),

    body("email")
        .notEmpty()
        .withMessage("Email is required.")
        .trim()
        .normalizeEmail()
        .isEmail()
        .withMessage("Invalid email format"),

    body("gender").notEmpty().withMessage('Gender is required'),

    body("phone")
        .trim()
        .notEmpty()
        .withMessage("Phone number is required")
        .customSanitizer((value) => value.replaceAll(/\s+/g, ""))
        .isMobilePhone("en-IN")
        .withMessage("Enter a valid phone number"),

    body("dob").notEmpty()
        .withMessage("DOB is required.")
        .isBefore(new Date().toISOString()).withMessage("Date must be in the past")
        .isISO8601()
        .withMessage("Invalid date format"),
        
    body("address").notEmpty().withMessage('Address is required'),
    body("status").notEmpty().withMessage('Status is required')
]

const validateDeletePatient = [
    body("patientId").notEmpty().withMessage("PatientId is required")
]

module.exports = { validateGetUserProfile, validateGetNameByEmployeeId, validateGetNameByPatientId, validateCreatePatient, validateDeletePatient };