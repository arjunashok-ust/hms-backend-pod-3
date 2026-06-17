const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { patientSignupValidation } = require("../validations/authValidation");
const validate = require("../middlewares/validate");
const requirePermission = require("../middlewares/permissionMiddleware");

router.get(
  "/all",
  authenticateToken,
  requirePermission("VIEW_PATIENTS"),
  patientController.getAllPatients,
);
router.post(
  "/create",
  authenticateToken,
  requirePermission("CREATE_PATIENT"),
  patientSignupValidation,
  validate,
  patientController.createPatient,
);
router.put(
  "/:id",
  authenticateToken,
  requirePermission("UPDATE_PATIENT"),
  patientController.updatePatient,
);
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("DELETE_PATIENT"),
  patientController.deletePatient,
);
router.post(
  "/mobile-register",
  patientController.createPatientFromMobile,
);

module.exports = router;
