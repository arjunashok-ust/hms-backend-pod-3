const { body, query } = require("express-validator");

exports.adminSignupValidation = [

    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("role").isIn([
            "ADMIN",
            "DOCTOR",
            "RECEPTIONIST",
            "CASHIER",
            "NURSE",
            "LAB_TECH",
            "PHARMACIST"
        ]).withMessage("Invalid role"),
    body("phone").matches(/^\d{10}$/).withMessage("Invalid phone number"),
    body("department").notEmpty().withMessage("Department required"),
    body("designation").notEmpty().withMessage("Designation required"),
    body("joiningDate").notEmpty().withMessage("Joining date required")
];


exports.SignupValidation = [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("role").isIn([
            "DOCTOR",
            "RECEPTIONIST",
            "CASHIER",
            "NURSE",
            "LAB_TECH",
            "PHARMACIST"
        ]).withMessage("Invalid role"),
    body("phone").matches(/^\d{10}$/).withMessage("Invalid phone number"),
    body("department").notEmpty().withMessage("Department required"),
    body("designation").notEmpty().withMessage("Designation required"),
    body("joiningDate").notEmpty().withMessage("Joining date required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
];

exports.loginValidation = [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password is required"),
];

exports.resetPasswordValidation = [
    body("prevPassword").notEmpty().withMessage("Previous Password is Required."),
    body("newPassword").notEmpty().withMessage("New Password is Required.") .isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("employeeId").notEmpty().withMessage("Employee Id is Required.")
];

exports.verifyMailValidation = [
    query("email").notEmpty().withMessage("Email Is Required"),
    query("verification_token").notEmpty().withMessage("Verification Token Is Required")
];