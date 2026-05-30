const { query } = require('express-validator');

const validateGetNameByEmployeeId = [
    query('employeeId').notEmpty().withMessage('Employee Id Is Required'),
];

const validateGetNameByCustomerId = [
    query('customerId').notEmpty().withMessage('Patient Id Is Required'),
];

module.exports = { validateGetNameByEmployeeId, validateGetNameByCustomerId };