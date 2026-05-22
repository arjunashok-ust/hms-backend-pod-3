const { query } = require('express-validator');

const validateGetUserProfile = [
    query('email').isEmail().withMessage('invalid email format'),
];

const validateGetNameByEmployeeId = [
    query('employeeId').notEmpty().withMessage('Employee Id Is Required'),
]

const validateGetNameByPatientId = [
    query('patientId').notEmpty().withMessage('Patient Id Is Required'),
]

module.exports = { validateGetUserProfile,validateGetNameByEmployeeId,validateGetNameByPatientId };