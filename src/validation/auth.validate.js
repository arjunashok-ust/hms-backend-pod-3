const { body, query } = require('express-validator');

const allowedRoleTypes = ['Owner', 'Admin', 'Doctor', 'Receptionist', 'Cashier', 'Nurse', 'Lab_Tech', 'Pharmacist'];
const allowedStatusTypes = ['Active', 'Inactive'];

const validateSignUp = [
    body('name').notEmpty().withMessage('name is required.'),
    body('email').isEmail().withMessage('invalid email format'),
    body('password').notEmpty().withMessage('password is empty.'),
    body('department').notEmpty().withMessage('department is required.'),
    body('designation').isIn(allowedRoleTypes).withMessage('designation is required.'),
    body('status').isIn(allowedStatusTypes).withMessage('status is required.'),
    body('joiningDate').notEmpty().withMessage('joining date is required.'),
];

const validateLogin = [
    body("email").isEmail().withMessage("email is invalid."),
    body("password").notEmpty().withMessage("password is required.")
]

const validateResetPassword = [
    body("prevPassword").notEmpty().withMessage("Previous Password is Required."),
        body("newPassword").notEmpty().withMessage("New Password is Required."),
    body("employeeId").notEmpty().withMessage("Employee Id is Required.")
]

const validateRefresh = [
    body("employeeId").notEmpty().withMessage("EmployeeId Is Required")
]

const validateSetPassword = [
    body("employeeId").notEmpty().withMessage("EmployeeId Is Required"),
    body("password").notEmpty().withMessage("Password Is Required")
]

const validateVerifyMail = [
    query("email").notEmpty().withMessage("Email Is Required"),
    query("verification_token").notEmpty().withMessage("Verification Token Is Required")
]

module.exports = { validateSignUp, validateLogin, validateResetPassword, validateRefresh, validateSetPassword, validateVerifyMail }