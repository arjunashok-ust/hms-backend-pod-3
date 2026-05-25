const { body } = require('express-validator');

const validateDeleteUserProfile = [
    body("employeeId").notEmpty().withMessage("Employee Id is Required")
];

const validateApproveUser = [
    body("employeeId").notEmpty().withMessage("Employee Id is Required")
];

const validateRejectUser = [
    body("employeeId").notEmpty().withMessage("Employee Id is Required")
];

module.exports = { validateDeleteUserProfile, validateApproveUser, validateRejectUser }