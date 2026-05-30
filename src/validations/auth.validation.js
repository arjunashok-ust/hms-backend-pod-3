const { body, query } = require('express-validator');
const givenRoles = ['OWNER','ADMIN', 'DOCTOR', 'RECEPTIONIST', 'CASHIER', 'NURSE', 'LAB_TECH', 'PHARMACIST'];
const givenStatus = ['ACTIVE', 'INACTIVE'];

//validation for signup
const validateSignUp = [
    body('name').notEmpty().withMessage('name is required.'),
    body('email').isEmail().withMessage('invalid email format'),
    body('password').notEmpty().withMessage('password is empty.'),
    body('department').toUpperCase().notEmpty().withMessage('department is required.'),
    body('designation').toUpperCase().notEmpty().withMessage('designation is required.'),
    body('status').toUpperCase().isIn(givenStatus).withMessage('status is required.'),
    body('joiningDate').notEmpty().withMessage('joining date is required.'),
    body('roles').toUpperCase().notEmpty().isIn(givenRoles).withMessage('roles is required'),
    body('phone').optional().isNumeric().isLength({min:10, max:10}).withMessage('phone number must have 10 digits')
];

// validation for login 
const loginValidation = [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password is required"),
];

const validateResetPassword = [
    body("oldPassword").notEmpty().withMessage("Old password is required."),
    body("newPassword").notEmpty().withMessage("New password is required."),
    body("employeeId").notEmpty().withMessage("Employee Id is required.")
];

const validateRefreshToken = [
    body("employeeId").notEmpty().withMessage("EmployeeId Is Required")
];

const validateSetPassword = [
    body("employeeId").notEmpty().withMessage("Email Is Invalid"),
    body("password").notEmpty().withMessage("Password Is Required")
];

const validateVerifyMail = [
    query("email").isEmail().notEmpty().withMessage("Email Is Required"),
    query("verificationToken").notEmpty().withMessage("Verification Token Is Required")
];

module.exports = { validateSignUp, loginValidation, validateResetPassword, validateRefreshToken,
    validateSetPassword, validateVerifyMail };