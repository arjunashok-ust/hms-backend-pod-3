const { body, query } = require("express-validator");


exports.getNameByEmployeeIdValidation = [
    query('employeeId').notEmpty().withMessage('Employee Id Is Required'),
];

exports.getNameByPatientIdValidation= [
    query('patientId').notEmpty().withMessage('Patient Id Is Required'),
];