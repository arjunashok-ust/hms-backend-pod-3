/**
 * @file medicalRecordValidation.js
 * @description
 * This file contains validation rules for medical record-related API endpoints.
 *
 * @overview
 * These validation chains are used as middleware in route definitions to ensure incoming request data for creating and updating medical records is valid before it reaches the controller.
 *
 * Connections:
 *   API Request -> route -> MEDICALRECORDVALIDATION.JS -> validate -> ...
 */

const { body } = require("express-validator");

/**
 * @description Validation chain for creating or updating a medical record.
 * It checks for required fields like doctor, appointment, and patient IDs. It also validates the format and type of optional clinical data like diagnosis, medications, and observations to ensure data integrity.
 */
const validateMedicalRecord = [
  body("doctorEmployeeId")
    .trim()
    .notEmpty()
    .withMessage("Doctor Employee ID is required.")
    .isString()
    .withMessage("Doctor Employee ID must be a valid string."),

  body("appointmentId")
    .trim()
    .notEmpty()
    .withMessage("Appointment ID is required.")
    .isString()
    .withMessage("Appointment ID must be a valid string."),

  body("patientId")
    .trim()
    .notEmpty()
    .withMessage("Patient ID is required.")
    .isString()
    .withMessage("Patient ID must be a valid string."),

  body("status")
    .optional()
    .trim()
    .toUpperCase()
    .isIn(["DRAFT", "FINAL"])
    .withMessage("Status must be either 'DRAFT' or 'FINAL'."),

  body("diagnosis")
    .optional()
    .isString()
    .withMessage("Diagnosis must be a text string."),

  body("complaint")
    .optional()
    .isString()
    .withMessage("Complaint must be a text string."),

  body("symptoms")
    .optional()
    .isString()
    .withMessage("Symptoms must be a text string."),

  body("notes")
    .optional()
    .isString()
    .withMessage("Notes must be a text string."),

  body("medications")
    .optional()
    .isArray()
    .withMessage("Medications must be formatted as an array."),
  body("medications.*.name")
    .optional()
    .isString()
    .withMessage("Medication name must be a string."),
  body("medications.*.dosage").optional().isString(),
  body("medications.*.frequency").optional().isString(),
  body("medications.*.duration").optional().isString(),
  body("medications.*.deliveryMethod").optional().isString(),

  body("medicalObservations")
    .optional()
    .isArray()
    .withMessage("Medical observations must be formatted as an array."),
  body("medicalObservations.*.metricName")
    .optional()
    .isString()
    .withMessage("Metric name must be a string."),
  body("medicalObservations.*.metricValue")
    .optional()
    .isString()
    .withMessage("Metric value must be a string."),
];

module.exports = { validateMedicalRecord };
