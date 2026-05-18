const { body, query } = require('express-validator');

const allowedRoleTypes = ['Owner', 'Admin', 'Doctor', 'Receptionist', 'Cashier', 'Nurse', 'Lab_Tech', 'Pharmacist'];
const allowedStatusTypes = ['Active','Inactive'];

const validateSignUp = [
    body('name').notEmpty().withMessage('name is required.'),
    body('email').isEmail().withMessage('invalid email format'),
    body('password').notEmpty().withMessage('password is empty.'),
    body('department').notEmpty().withMessage('department is required.'),
    body('designation').isIn(allowedRoleTypes).withMessage('designation is required.'),
    body('status').isIn(allowedStatusTypes).withMessage('status is required.'),
    body('joiningDate').notEmpty().withMessage('joining date is required.'),
    body('specialization').notEmpty().withMessage('specialization is required.'),
    body('qualification').notEmpty().withMessage('qualification is required.'),
];

const validateLogin = [
    body("email").isEmail().withMessage("email is invalid."),
    body("password").notEmpty().withMessage("password is required.")
]

module.exports = { validateSignUp,validateLogin }