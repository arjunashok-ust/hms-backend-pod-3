const { body, query } = require("express-validator");


exports.appointmentValidation = [

   body("patientId")
   .notEmpty()
   .withMessage("Patient ID required"),

   body("doctorEmployeeId")
   .notEmpty()
   .withMessage("Doctor employee ID required"),

   body("date")
   .notEmpty()
   .withMessage("Date required"),

   body("timeSlot")
   .notEmpty()
   .withMessage("Time slot required")
];
