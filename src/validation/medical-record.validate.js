const { body, query } = require("express-validator");

const validateCreateMedicalRecord = [
    body("medicalRecordId")
        .optional()
        .isString()
        .withMessage("medicalRecordId must be a string"),

    body("doctorId")
        .notEmpty()
        .withMessage("doctorId is required")
        .isString()
        .withMessage("doctorId must be a string"),

    body("appointmentId")
        .notEmpty()
        .withMessage("appointmentId is required")
        .isString(),

    body("patientId")
        .notEmpty()
        .withMessage("patientId is required")
        .isString(),

    body("complaint")
        .if(body("status").not().equals("Drafted"))
        .notEmpty()
        .withMessage("complaint is required")
        .isString(),

    body("symptoms")
        .if(body("status").not().equals("Drafted"))
        .notEmpty()
        .withMessage("symptoms are required")
        .isString(),

    body("diagnosis")
        .if(body("status").not().equals("Drafted"))
        .notEmpty()
        .withMessage("diagnosis is required")
        .isString(),

    body("medications")
        .optional()
        .isArray()
        .withMessage("medications must be an array"),

    body("medications.*.name")
        .optional()
        .isString()
        .withMessage("medication name must be string"),

    body("medications.*.dosage")
        .optional()
        .isString(),

    body("medications.*.frequency")
        .optional()
        .isString(),

    body("medications.*.duration")
        .optional()
        .isString(),

    body("medicalObservation")
        .optional()
        .isArray()
        .withMessage("medicalObservation must be an array"),

    body("medicalObservation.*.metricName")
        .optional()
        .isString(),

    body("medicalObservation.*.metricValue")
        .optional()
        .isString(),

    body("medicalObservation.*.recordedTime")
        .optional()
        .isISO8601()
        .withMessage("recordedTime must be a valid date"),

    body("notes")
        .optional()
        .isString(),

    body("createdBy")
        .notEmpty()
        .withMessage("createdBy is required")
        .isString(),

    body("updatedBy")
        .optional()
        .isString(),

    body("updatedAt")
        .optional()
        .isISO8601()
        .withMessage("updatedAt must be a valid date"),

    body("status")
        .optional()
        .isString()
];

const validateGetMedicalRecords = [
    query("page").notEmpty().withMessage("Page is required."),
    query("limit").notEmpty().withMessage("Limit is required.")
]

const validateGetMedicalRecordById = [
    query("medicalRecordId").notEmpty().withMessage("Medical Record Id is required."),
]

module.exports = { validateCreateMedicalRecord, validateGetMedicalRecords, validateGetMedicalRecordById }