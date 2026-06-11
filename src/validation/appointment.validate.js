const { body, query } = require('express-validator');
const { validate } = require('../models/counter.model');


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

const validateEditAppointment = [
    body("appointmentId").notEmpty().withMessage("Appointment Id is Required"),
    body("patientId").notEmpty().withMessage("Patient Id is Required"),
    body("doctorEmployeeId").notEmpty().withMessage("Doctor Id is Required"),
    body("date").notEmpty().withMessage("Date is Required"),
    body("timeSlot").notEmpty().withMessage("Time Slot is Required"),
]

const validateEditAppointmentStatus = [
    body("appointmentId").notEmpty().withMessage("Appointment Id is Required"),
    body("status").notEmpty().withMessage("Status is required"),
]

module.exports = { 
    validateCreateAppointment, 
    validateDeleteAppointment, 
    validateGetAppointmentByPatientId, 
    validateGetDoctorByEmployeeId, 
    validateEditAppointment, 
    validateEditAppointmentStatus, 
}