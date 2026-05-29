const { body,query } = require('express-validator');

const validateGetUserProfile = [
    query('email').isEmail().withMessage('invalid email format'),
];

const validateGetNameByEmployeeId = [
    query('employeeId').notEmpty().withMessage('Employee Id Is Required'),
]

const validateGetNameByPatientId = [
    query('patientId').notEmpty().withMessage('Patient Id Is Required'),
]

const validateCreatePatient = [
    body("name").notEmpty().withMessage('Name is required'),
    body("email").isEmail().withMessage('Email is required'),
    body("gender").notEmpty().withMessage('Gender is required'),
    body("phone").isMobilePhone("en-IN").withMessage("Phone Number Invalid"),
    body("dob").notEmpty().withMessage('DOB is required'),
    body("address").notEmpty().withMessage('Address is required'),
    body("status").notEmpty().withMessage('Status is required')
]

const validateDeletePatient = [
    body("patientId").notEmpty().withMessage("PatientId is required")
]

module.exports = { validateGetUserProfile,validateGetNameByEmployeeId,validateGetNameByPatientId,validateCreatePatient,validateDeletePatient };