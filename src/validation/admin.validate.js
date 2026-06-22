const { body } = require('express-validator');

const allowedRoleTypes = [
    "Admin",
    "Super Admin",
    "Doctor",
    "Receptionist",
    "Cashier",
    "Nurse",
    "Pharmacist",
    "LabTech"
];

const allowedDepartments = ["OPD", "IPD", "ICU", "Pharmacy", "Administration", "Front Office"];

const medicalRoles = new Set([
    "Doctor",
    "Nurse",
    "Pharmacist",
    "LabTech"
]);

const validateDeleteUserProfile = [
    body("employeeId").notEmpty().withMessage("Employee Id is Required")
];

const validateApproveUser = [
    body("employeeId").notEmpty().withMessage("Employee Id is Required")
];

const validateRejectUser = [
    body("employeeId").notEmpty().withMessage("Employee Id is Required")
];

const getRole = (req) => req.body?.data?.role;

const requireForDoctor = (fieldName, validatorFn) => {
    return (value, { req }) => {
        const role = getRole(req);

        if (role === "Doctor") {
            return validatorFn(value, req);
        }

        if (value != null && value !== "" && (!Array.isArray(value) || value.length !== 0)) {
            throw new Error(`${fieldName} is only for doctors`);
        }

        return true;
    };
};

const validateUpdateProfile = [
    body("data.name")
        .trim()
        .notEmpty().withMessage("Name is required.")
        .matches(/^[a-zA-Z\s]+$/).withMessage("Name must contain only letters and spaces"),

    body("data.email")
        .notEmpty().withMessage("Email is required.")
        .trim()
        .normalizeEmail()
        .isEmail().withMessage("Invalid email format"),

    body("data.password")
        .if(body("data.status").not().equals("Active"))
        .notEmpty().withMessage("Password is required.")
        .isLength({ min: 8 }).withMessage("Password must contain at least 8 characters.")
        .matches(/[A-Z]/).withMessage("Password must contain an uppercase character")
        .matches(/\d/).withMessage("Password must contain a digit"),

    body("data.department")
        .notEmpty().withMessage("Department is required.")
        .isIn(allowedDepartments).withMessage("Invalid department."),

    body("data.role")
        .notEmpty().withMessage("Role is required.")
        .isIn(allowedRoleTypes).withMessage("Invalid role."),

    body("data.designation")
        .trim()
        .notEmpty().withMessage("Designation is required"),

    body("data.joiningDate")
        .notEmpty().withMessage("Joining date is required.")
        .isISO8601().withMessage("Invalid date format"),

    body("data.consultationFee").custom(
        requireForDoctor("Consultation fee", (value) => {
            if (!value) {
                throw new Error("Consultation fee is required for doctors.");
            }
            if (Number.isNaN(Number(value)) || Number(value) < 0) {
                throw new Error("Consultation fee must be numeric.");
            }
            return true;
        })
    ),

    body("data.availabilitySlots").custom(
        requireForDoctor("Availability slots", (value) => {
            if (!Array.isArray(value) || value.length === 0) {
                throw new Error("Availability slots are required for doctors.");
            }
            return true;
        })
    ),

    body("data.medicalRegistrationNo").custom((value, { req }) => {
        const role = getRole(req);

        if (medicalRoles.has(role) && !value) {
            throw new Error("Medical registration no is required for this role");
        }

        return true;
    }),

    body("data.specialization").custom((value, { req }) => {
        const role = getRole(req);

        if (role === "Doctor" && !value) {
            throw new Error("Specialization is required for this role");
        }

        return true;
    })
];

module.exports = { validateDeleteUserProfile, validateApproveUser, validateRejectUser, validateUpdateProfile }