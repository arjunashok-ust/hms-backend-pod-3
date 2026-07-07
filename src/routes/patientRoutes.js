/**
 * @file patientRoutes.js
 * @description
 * This file defines the API routes for patient management.
 *
 * @overview
 * This router handles endpoints for creating, retrieving, updating, and deleting patient records.
 * It includes a public route for patient self-registration via mobile and protected routes for administrative management.
 * It uses middleware for authentication, permission checking, and input validation.
 * A typical request flows through: API Request -> PATIENTROUTES.JS -> [Middleware(s)] -> validation -> validate -> asyncHandler -> patientController -> Model(s).
 * Any errors are caught by `asyncHandler` and passed to the global `errorMiddleware`.
 *
 * Connections:
 *   API Request -> PATIENTROUTES.JS -> [authenticateToken, requirePermission, authValidation, validate] -> asyncHandler -> patientController -> [Patients, Users, Appointments] Models
 */
const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const asyncHandler = require("../middlewares/asyncHandler");
const { authenticateToken } = require("../middlewares/authMiddleware");
const {
  patientSignupValidation,
  patientSignupByAdminValidation,
  patientSelfUpdate,
} = require("../validations/authValidation");
const validate = require("../middlewares/validate");
const requirePermission = require("../middlewares/permissionMiddleware");

router.get(
  "/all",
  authenticateToken,
  requirePermission("VIEW_PATIENTS"),
  asyncHandler(patientController.getAllPatients),
);
router.post(
  "/create",
  authenticateToken,
  requirePermission("CREATE_PATIENT"),
  patientSignupByAdminValidation,
  validate,
  asyncHandler(patientController.createPatient),
);
router.put(
  "/:id",
  authenticateToken,
  requirePermission(["UPDATE_PATIENT", "UPDATE_PATIENT_SELF"]),
  patientSelfUpdate,
  validate,
  asyncHandler(patientController.updatePatient),
);
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("DELETE_PATIENT"),
  asyncHandler(patientController.deletePatient),
);
router.post(
  "/mobile-register",
  patientSignupValidation,
  validate,
  asyncHandler(patientController.createPatientFromMobile),
);

module.exports = router;
