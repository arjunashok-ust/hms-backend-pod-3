const { body } = require("express-validator");

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

  // Status Validation
  body("status")
    .optional()
    .trim()
    .toUpperCase()
    .isIn(["DRAFT", "FINAL"])
    .withMessage("Status must be either 'DRAFT' or 'FINAL'."),

  // Text Fields (Optional)
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

  // Medications Array Validation
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

  // Medical Observations Array Validation
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
