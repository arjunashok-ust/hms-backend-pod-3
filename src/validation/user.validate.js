const { body, query } = require('express-validator');

const validateGetUserProfile = [
    query("email").isEmail().withMessage("invalid email format"),
];

const validateGetNameByEmployeeId = [
    query("employeeId").notEmpty().withMessage("Employee Id Is Required"),
]

const validateGetNameByPatientId = [
    query("patientId").notEmpty().withMessage("Patient Id Is Required"),
]

const validateDeletePatient = [
    body("patientId").notEmpty().withMessage("PatientId is required")
]

const validateGetPatientProfile = [
    query("email").notEmpty().withMessage("Email is required")
]

const validateGetPatientId = [
    query("email").notEmpty().withMessage("email is required")
]

const validateGetAvailableTimeSlots = [
    query("employeeId").notEmpty().withMessage("employee id required"),
    query("date").notEmpty().withMessage("date is required"),
]

const validateUpdatePatientProfile = [
    body("patientId").notEmpty().withMessage("Patient Id is required!"),
]

const validateGetPatientsBySearch = [
    query("searchText").notEmpty().withMessage("Search text is required"),
]

const validateGetDoctorsBySearch = [
    query("searchText").notEmpty().withMessage("Search text is required"),
]

const validateGetPatientById = [
    query("patientId").notEmpty().withMessage("Patient Id is required."),
]

const validateGetDoctorById = [
    query("doctorId").notEmpty().withMessage("Doctor Id is required."),
]

const validateGetSingleUser = [
    query("email").notEmpty().withMessage("Email is required"),
]

const validatePagination = [
    query("page").notEmpty().withMessage("Page is required"),
    query("limit").notEmpty().withMessage("Limit is required")
]

module.exports = {
    validateGetUserProfile,
    validateGetNameByEmployeeId,
    validateGetNameByPatientId,
    validateDeletePatient,
    validateGetPatientProfile,
    validateGetPatientId,
    validateGetAvailableTimeSlots,
    validateUpdatePatientProfile,
    validateGetPatientsBySearch,
    validateGetDoctorsBySearch,
    validateGetPatientById,
    validateGetDoctorById,
    validateGetSingleUser,
    validatePagination,
};