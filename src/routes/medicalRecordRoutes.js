const express = require("express");
const router = express.Router();

const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const checkPermission = require("../middlewares/checkPermission");
const PERMISSIONS = require("../constants/permissions");

const {
  createMedicalRecord,
  getMedicalRecords,
  updateMedicalRecord,
  deleteMedicalRecord,
} = require("../controllers/medicalRecordController");

/* VALIDATION */
const createMedicalRecordValidation = [
  body("doctorEmployeeId").notEmpty().withMessage("Doctor is required"),
  body("appointmentId").notEmpty().withMessage("Appointment is required"),
  body("patientId").notEmpty().withMessage("Patient is required"),
  body("status").optional().isIn(["DRAFT", "FINAL"]).withMessage("Status must be DRAFT or FINAL"),
];

const updateMedicalRecordValidation = [
  body("status").optional().isIn(["DRAFT", "FINAL"]).withMessage("Status must be DRAFT or FINAL"),
  body("medications").optional().isArray().withMessage("Medications must be an array"),
  body("medicalObservations").optional().isArray().withMessage("Medical observations must be an array"),
];

/* CREATE */
router.post("/createMedicalRecord",auth,checkPermission(PERMISSIONS.CREATE_MEDICAL_RECORD),createMedicalRecordValidation,validate,createMedicalRecord,);
/* READ */
router.get("/getMedicalRecords",auth,checkPermission(PERMISSIONS.VIEW_MEDICAL_RECORD),getMedicalRecords,);
/* UPDATE */
router.put("/updateMedicalRecord/:id",auth,checkPermission(PERMISSIONS.EDIT_MEDICAL_RECORD),updateMedicalRecordValidation,validate,updateMedicalRecord,);
/* DELETE (soft delete) */
router.delete("/deleteMedicalRecord/:id",auth,checkPermission(PERMISSIONS.DELETE_MEDICAL_RECORD),deleteMedicalRecord,);

module.exports = router;