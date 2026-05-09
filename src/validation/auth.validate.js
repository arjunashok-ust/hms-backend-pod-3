const { body, query } = require('express-validator');

const allowedTypes = ['owner', 'admin', 'doctor', 'receptionist', 'cashier', 'nurse', 'lab_tech', 'pharmacist'];

const validateSignUp = [
    body('name').notEmpty().withMessage('name is required.'),
    body('email').isEmail().withMessage('invalid email format'),
    body('password').notEmpty().withMessage('password is empty.'),
    body('department').notEmpty().withMessage('department is required.'),
    body('designation').isIn(allowedTypes).thMessage('designation is required.'),
    body('status').notEmpty().withMessage('status is required.'),
    body('joiningDate').notEmpty().withMessage('joining date is required.'),
    body('medicalRegistrationNo').notEmpty().withMessage('medicalRegistration number is required'),
    body('specialization').notEmpty().withMessage('specialization is required.'),
    body('qualification').notEmpty().withMessage('qualification is required.'),
    body('consultationFee').notEmpty().withMessage('consultationFee'),
    body('availabilitySlots').notEmpty().withMessage('availability slots is required')
];

const validateLogin = [
    body("email").isEmail().withMessage("email is invalid."),
    body("password").notEmpty().withMessage("password is required.")
]

module.exports = { validateSignUp,validateLogin }