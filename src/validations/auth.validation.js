const { body } = require('express-validator');
const givenRoles = ['OWNER', 'ADMIN', 'DOCTOR', 'RECEPTIONIST', 'CASHIER', 'NURSE', 'LAB_TECH', 'PHARMACIST'];
const givenStatus = ['ACTIVE', 'INACTIVE'];
const givenDepartments = ["OPD", "IPD", "LAB", "PHARMACY", "ADMINISTRATION"];
const medicRoles = new Set(['DOCTOR', 'NURSE', 'LAB_TECH', 'PHARMACIST']);

//validation for signup
const validateSignUp = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 3 })
        .withMessage('Name must have atleast 3 characters.')
        .matches(/^[A-Za-z\s]+$/)
        .withMessage("Name must only contain letters and spaces"),

    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .toLowerCase()
        .isEmail()
        .withMessage('Invalid email format'),

    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must have atleast 8 characters.')
        .matches(/[A-Z]/)
        .withMessage('Password must have atleast one uppercase letter')
        .matches(/[a-z]/)
        .withMessage('Password must have atleast one lowercase letter')
        .matches(/\d/)
        .withMessage('Password must have atleast one number')
        .matches(/[^A-Za-z0-9]/)
        .withMessage('Password must have atleast one special character'),

    body("phone")
        .trim()
        .notEmpty()
        .withMessage("Phone number is required")
        .customSanitizer((value) => value.replaceAll(/\s+/g, ""))
        .isMobilePhone("en-IN")
        .withMessage("Enter a valid phone number"),

    body('department')
        .notEmpty()
        .withMessage('Department is required.')
        .toUpperCase()
        .isIn(givenDepartments)
        .withMessage('Invalid department.'),

    body('roles')
        .notEmpty()
        .withMessage('Role is required.')
        .toUpperCase()
        .isIn(givenRoles)
        .withMessage('Invalid role.'),

    body('joiningDate')
        .notEmpty()
        .withMessage('Joining date is required.')
        .isISO8601()
        .withMessage('Invalid date format'),

    body('specialization')
        .optional()
        .isString()
        .withMessage('Specialization must be a string.'),

    body('qualification')
        .notEmpty()
        .isArray({ min: 1 })
        .withMessage('Qualification is required.'),

    body('designation')
        .trim()
        .notEmpty()
        .withMessage('Designation is required.'),

    body('availabilitySlots').custom((value, { req }) => {
        if (req.body.roles === "DOCTOR" && (!value || value.length === 0)) {
            throw new Error("Availability Slots is required for Doctor");
        }
        if (req.body.roles !== "DOCTOR" && value) {
            throw new Error("Availability Slots is available only for Doctor");
        }
        return true;
    }),

    body("medicalRegistrationNo").custom((value, { req }) => {
        if (medicRoles.has(req.body.roles) && !value) {
            throw new Error("Medical registration no is required for this role");
        }
        if (!(medicRoles.has(req.body.roles)) && value) {
            throw new Error("Medical registration no is available only for medical based roles");
        }
        if (value && typeof value !== "string") {
            throw new Error("Medical registration no must be a string");
        }
        return true;
    }),

    body('consultationFee')
        .custom((value, { req }) => {
            if (req.body.roles === "DOCTOR" && !value) {
                throw new Error("Consultation fee is required for Doctor");
            }
            if (req.body.roles !== "DOCTOR" && value) {
                throw new Error("Consultation fee is available only for Doctor");
            }
            return true;
        })
        .optional()
        .isNumeric()
        .withMessage('Consultation fee must be number')
];

// validation for login 
const loginValidation = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("email is required")
        .isEmail()
        .withMessage('valid email required'),

    body("password")
        .notEmpty()
        .withMessage("Password is required"),
];

module.exports = { validateSignUp, loginValidation };