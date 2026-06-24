const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const asyncHandler = require("../middlewares/asyncHandler");
const { authenticateToken } = require("../middlewares/authMiddleware");
const {
  patientSignupValidation,
  patientSignupByAdminValidation,
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
  requirePermission("UPDATE_PATIENT"),
  patientSignupByAdminValidation,
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
