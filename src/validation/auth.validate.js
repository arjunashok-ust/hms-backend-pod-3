const { body, query } = require('express-validator');

const allowedRoleTypes = [
    "Admin",
    "Doctor",
    "Receptionist",
    "Cashier",
    "Nurse",
    "Pharmacist",
    "LabTech"
];

const medicalRoles = new Set([
    "Doctor",
    "Nurse",
    "Pharmacist",
    "LabTech"
]);

const allowedDepartments = ["OPD", "IPD", "ICU", "Pharmacy", "Administration", "Front Office"];
const allowedBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const allowedStatusTypes = ["Active", "Inactive", "Pending"];

const validateSignUp = [
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

    body("password")
        // for admin signup
        .if(body("status").not().equals("Active"))
        .notEmpty()
        .withMessage("Password is required.")
        .isLength({ min: 8 })
        .withMessage("Password must contain atleast 8 characters.")
        .matches(/[A-Z]/).withMessage("Password must contain a uppercase character")
        .matches(/\d/).withMessage("Password must contain a digit"),

    body("department").notEmpty().withMessage("Department is required.").isIn(allowedDepartments).withMessage("Invalid department."),

    body("role")
        .notEmpty()
        .withMessage("Role is required.")
        .isIn(allowedRoleTypes)
        .withMessage("Invalid role."),

    body("designation").trim().notEmpty().withMessage("Designation is required"),

    body("joiningDate")
        .notEmpty()
        .withMessage("Joining date is required.")
        .isISO8601()
        .withMessage("Invalid date format"),

    body("consultationFee").custom((value, { req }) => {
        if (req.body.role === "Doctor") {
            if (!value) {
                throw new Error("Consultation fee is required for doctors.");
            }
            if (Number.isNaN(value) || Number(value) < 0) {
                throw new Error("Consultation fee must be numeric.");
            }
        } else if (value) {
            throw new Error("Consultation fee is only for doctors");
        }
        return true;
    }),

    body("availabilitySlots").custom((value, { req }) => {
        if (req.body.role === "Doctor") {
            if (!Array.isArray(value) || value.length === 0) {
                throw new Error("Availability slots are required for doctors.");
            }
        } else if (value != null) {
            throw new Error("Availability slots are only for doctors.");
        }
        return true;
    }),

    body("medicalRegistrationNo").custom((value, { req }) => {
        if (medicalRoles.has(req.body.role) && !value) {
            throw new Error("Medical registration no is required for this role");
        }
        return true;
    }),

    body("specialization").custom((value, { req }) => {
        if (req.body.role === "Doctor") {
            if (!value) {
                throw new Error("Specialization is required for this role");
            }
        }
        return true;
    })
];

const validateLogin = [
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


const validateSetPassword = [
    body("email")
        .trim()
        .notEmpty()
        .normalizeEmail()
        .withMessage("Email is required.")
        .isEmail()
        .withMessage("Invalid email format"),
    body("password")
        .notEmpty()
        .withMessage("Password is required.")
        .isLength({ min: 8 })
        .withMessage("Password must contain atleast 8 characters."),
]

const validateVerifyMail = [
    query("email").trim()
        .notEmpty()
        .normalizeEmail()
        .withMessage("Email is required.")
        .isEmail()
        .withMessage("Invalid email format"),
    query("verification_token").notEmpty().withMessage("Verification Token Is Required")
]

const validatePatientSignUp = [
    body("name").notEmpty().withMessage("Name is required"),
    body("role").notEmpty().withMessage("Role is required"),
    body("email").isEmail().withMessage("Email is required"),
    body("gender").notEmpty().withMessage("Gender is required"),
    body("phone").notEmpty().withMessage("Phone Number Invalid"),
    body("dob").notEmpty().withMessage("DOB is required"),
    body("address").notEmpty().withMessage("Address is required"),
    body("bloodGroup").notEmpty().withMessage("Blood group is required"),
]

const validateGetPermissions = [
    query("role").notEmpty().withMessage("role is required."),
]

const validateResetPassword = [
    body("email").notEmpty().withMessage("email is required!"),
]

const validateVerifyResetPassword = [
    query("email").notEmpty().withMessage("email is required"),
    query("reset_token").notEmpty().withMessage("reset_token is required")
]


module.exports = { validateSignUp, validateLogin, validateSetPassword, validateVerifyMail, validatePatientSignUp, validateGetPermissions, validateResetPassword, validateVerifyResetPassword }