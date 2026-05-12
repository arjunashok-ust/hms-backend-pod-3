const { body } = require('express-validator');
const givenRoles = ['OWNER', 'ADMIN', 'DOCTOR', 'RECEPTIONIST', 'CASHIER', 'NURSE', 'LAB_TECH', 'PHARMACIST'];
const givenStatus = ['ACTIVE', 'INACTIVE'];

//validation for signup
const validateSignUp = [
    body('name').notEmpty().withMessage('name is required.'),
    body('email').isEmail().withMessage('invalid email format'),
    body('password').notEmpty().withMessage('password is empty.'),
    body('department').notEmpty().withMessage('department is required.'),
    body('designation').toUpperCase().isIn(givenRoles).withMessage('designation is required.'),
    body('status').toUpperCase().isIn(givenStatus).withMessage('status is required.'),
    body('joiningDate').notEmpty().withMessage('joining date is required.'),
    body('specialization').notEmpty().withMessage('specialization is required.'),
    body('qualification').notEmpty().withMessage('qualification is required.'),
];

// validation for login 
const loginValidation = [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password is required"),
];

module.exports = { validateSignUp, loginValidation };