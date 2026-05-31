const { body, query } = require('express-validator');

const allowedStatusTypes = ['Active', 'Inactive','Pending'];

const validateSignUp = [
    body('name').notEmpty().withMessage('name is required.'),
    body('email').isEmail().withMessage('invalid email format'),
    body('department').notEmpty().withMessage('department is required.'),
    body('joiningDate').isBefore(new Date().toISOString()).withMessage("date must be in the past"),
    body('designation').notEmpty().withMessage('designation is required.'),
    body('status').isIn(allowedStatusTypes).withMessage('status is required.'),
];


const validateLogin = [
    body("email").isEmail().withMessage("email is invalid."),
    body("password").notEmpty().withMessage("password is required.")
]


const validateSetPassword = [
    body("email").isEmail().withMessage("Email Is Invalid"),
    body("password").notEmpty().withMessage("Password Is Required")
]

const validateVerifyMail = [
    query("email").notEmpty().withMessage("Email Is Required"),
    query("verification_token").notEmpty().withMessage("Verification Token Is Required")
]

module.exports = { validateSignUp, validateLogin,  validateSetPassword, validateVerifyMail }