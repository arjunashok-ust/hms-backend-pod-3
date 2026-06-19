const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const { authenticateToken } = require("../middlewares/authMiddleware");
const requirePermission = require("../middlewares/permissionMiddleware");

const {
  validateMedicalRecord,
} = require("../validations/medicalRecordValidation");

const medicalRecordController = require("../controllers/medicalRecordController");

router.post(
  "/createRecord",
  authenticateToken,
  requirePermission("CREATE_HEALTH_RECORD"),
  validateMedicalRecord,
  validate,
  medicalRecordController.createMedicalRecord,
);

router.put(
  "/updateRecord/:id",
  authenticateToken,
  requirePermission("UPDATE_HEALTH_RECORD"),
  validateMedicalRecord,
  validate,
  medicalRecordController.updateMedicalRecord,
);

router.delete(
  "/deleteRecord/:id",
  authenticateToken,
  requirePermission("DELETE_HEALTH_RECORD"),
  medicalRecordController.deleteMedicalRecord,
);

// FETCH ALL / FILTER
router.get(
  "/getAllRecords",
  authenticateToken,
  requirePermission("VIEW_HEALTH_RECORDS"),
  medicalRecordController.getMedicalRecords,
);

// FETCH SINGLE BY ID
router.get(
  "/getRecord/:id",
  authenticateToken,
  requirePermission("VIEW_HEALTH_RECORDS"),
  medicalRecordController.getMedicalRecordById,
);

module.exports = router;
