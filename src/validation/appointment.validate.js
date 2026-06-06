const { body, query } = require('express-validator');


const validateCreateAppointment = [
    body("patientId").notEmpty().withMessage("Patient Id is Required"),
    body("doctorEmployeeId").notEmpty().withMessage("Doctor Id is Required"),
    body("date").notEmpty().withMessage("Date is Required"),
    body("timeSlot").notEmpty().withMessage("Time Slot is Required"),
    body("createdByEmployeeId").notEmpty().withMessage("Creator Employee Id is Required"),
]

const validateDeleteAppointment = [
    query("appointmentId").notEmpty().withMessage("Appointment Id is Required")
]

const validateGetAppointmentByPatientId = [
    query("patientId").notEmpty().withMessage("Patient Id is required")
]

const validateGetDoctorByEmployeeId = [
    query("employeeId").notEmpty().withMessage("Doctor Employee Id is required")
]

module.exports = { validateCreateAppointment, validateDeleteAppointment, validateGetAppointmentByPatientId, validateGetDoctorByEmployeeId }