/**
 * @file medicalRecordRoutes.js
 * @description
 * This file defines the API routes for managing patient medical records.
 *
 * @overview
 * This router handles endpoints for creating, updating, deleting, and retrieving medical records.
 * It includes role-specific routes for doctors to get their records and for patients to get their own.
 * It uses middleware for authentication, permission checking, and input validation.
 * A typical request flows through: API Request -> MEDICALRECORDROUTES.JS -> authenticateToken -> requirePermission -> validation (validateMedicalRecord) -> validate -> asyncHandler -> medicalRecordController -> Model(s).
 * Any errors are caught by `asyncHandler` and passed to the global `errorMiddleware`.
 *
 * Connections:
 *   API Request -> MEDICALRECORDROUTES.JS -> [authenticateToken, requirePermission, medicalRecordValidation, validate] -> asyncHandler -> medicalRecordController -> [MedicalRecords, Appointments, etc.] Models
 */
const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const asyncHandler = require("../middlewares/asyncHandler");
const { authenticateToken } = require("../middlewares/authMiddleware");
const requirePermission = require("../middlewares/permissionMiddleware");
const {
  validateMedicalRecord,
} = require("../validations/medicalRecordValidation");
const medicalRecordController = require("../controllers/medicalRecordController");

router.post(
  "/createRecord",
  authenticateToken,
  requirePermission(["CREATE_RECORD", "CREATE_RECORD_FOR_ANYONE"]),
  validateMedicalRecord,
  validate,
  asyncHandler(medicalRecordController.createMedicalRecord),
);
router.put(
  "/updateRecord/:id",
  authenticateToken,
  requirePermission("UPDATE_RECORD"),
  validateMedicalRecord,
  validate,
  asyncHandler(medicalRecordController.updateMedicalRecord),
);
router.delete(
  "/deleteRecord/:id",
  authenticateToken,
  requirePermission("DELETE_HEALTH_RECORD"),
  asyncHandler(medicalRecordController.deleteMedicalRecord),
);

router.get(
  "/getAllRecords",
  authenticateToken,
  requirePermission("VIEW_ALL_RECORDS"),
  asyncHandler(medicalRecordController.getAllMedicalRecords),
);
router.get(
  "/getMyRecords",
  authenticateToken,
  requirePermission("VIEW_MY_PATIENT_RECORDS"),
  asyncHandler(medicalRecordController.getMyMedicalRecords),
);
router.get(
  "/getRecord/:id",
  authenticateToken,
  requirePermission("VIEW_HEALTH_RECORDS"),
  asyncHandler(medicalRecordController.getMedicalRecordById),
);

router.get(
  "/getPatientRecords",
  authenticateToken,
  requirePermission("VIEW_MY_RECORDS"),
  asyncHandler(medicalRecordController.getPatientMedicalRecords),
);

module.exports = router;
