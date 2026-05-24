const { body } = require('express-validator');

const validateDeleteUserProfile = [
    body("employeeId").notEmpty().withMessage("Employee Id is Required")
];

module.exports = { validateDeleteUserProfile }