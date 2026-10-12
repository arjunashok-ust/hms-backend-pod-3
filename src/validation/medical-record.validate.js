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
        .if(body("status").not().equals("Draft"))
        .notEmpty()
        .withMessage("complaint is required")
        .isString(),

    body("symptoms")
        .if(body("status").not().equals("Draft"))
        .notEmpty()
        .withMessage("symptoms are required")
        .isString(),

    body("diagnosis")
        .if(body("status").not().equals("Draft"))
        .notEmpty()
        .withMessage("diagnosis is required")
        .isString(),

    body("medications")
        .optional({ nullable: true, checkFalsy: true })
        .isArray()
        .withMessage("medications must be an array"),

    body("medications.*.name")
        .optional({ nullable: true, checkFalsy: true })
        .isString()
        .withMessage("medication name must be string"),

    body("medications.*.dosage")
        .optional({ nullable: true, checkFalsy: true })
        .isString(),

    body("medications.*.frequency")
        .optional({ nullable: true, checkFalsy: true })
        .isString(),

    body("medications.*.duration")
        .optional({ nullable: true, checkFalsy: true })
        .isString(),

    body("medicalObservation")
        .optional({ nullable: true, checkFalsy: true })
        .isArray()
        .withMessage("medicalObservation must be an array"),

    body("medicalObservation.*.metricName")
        .optional({ nullable: true, checkFalsy: true })
        .isString(),

    body("medicalObservation.*.metricValue")
        .optional({ nullable: true, checkFalsy: true })
        .isString(),

    body("medicalObservation.*.recordedTime")
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601()
        .withMessage("recordedTime must be a valid date"),

    body("notes")
        .optional({ nullable: true, checkFalsy: true })
        .isString(),

    body("createdBy")
        .notEmpty()
        .withMessage("createdBy is required")
        .isString(),

    body("updatedBy")
        .optional({ nullable: true, checkFalsy: true })
        .isString(),

    body("updatedAt")
        .optional({ nullable: true, checkFalsy: true })
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

const validateDeleteMedicalRecord = [
    body("medicalRecordId").notEmpty().withMessage("Medical Record Id is required."),
]

module.exports = { validateCreateMedicalRecord, validateGetMedicalRecords, validateGetMedicalRecordById, validateDeleteMedicalRecord }