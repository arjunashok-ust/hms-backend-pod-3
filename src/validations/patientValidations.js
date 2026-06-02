const { body, query, param } = require("express-validator");

exports.createPatientValidation = [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("phone").matches(/^\d{10}$/).withMessage("Invalid phone number"),
    body("email").isEmail().withMessage("Valid email required"),body("gender").isIn(["Male", "Female", "Other"]).withMessage("Invalid gender"),body("dob").notEmpty().withMessage("Date of birth required"),body("address").trim().notEmpty().withMessage("Address required")];

exports.patientIdValidation = [param("patientId").notEmpty().withMessage("Patient ID required")];