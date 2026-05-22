const { body } = require('express-validator');


const validateCreateAppointment = [
    body("patientId").notEmpty().withMessage("Patient Id is Required"),
    body("doctorEmployeeId").notEmpty().withMessage("Doctor Id is Required"),
    body("date").notEmpty().withMessage("Date is Required"),
    body("timeSlot").notEmpty().withMessage("Time Slot is Required"),
    body("status").notEmpty().withMessage("Status is Required"),
    body("createdByEmployeeId").notEmpty().withMessage("Creator Employee Id is Required"),
]

module.exports = { validateCreateAppointment }