const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { patientSignupValidation } = require("../validations/authValidation");
const validate = require("../middlewares/validate");

router.get("/all", authenticateToken, patientController.getAllPatients);
router.post(
  "/create",
  authenticateToken,
  patientSignupValidation,
  validate,
  patientController.createPatient,
);
router.put("/:id", authenticateToken, patientController.updatePatient);
router.delete("/:id", authenticateToken, patientController.deletePatient);
router.post(
  "/mobile-register",
  authenticateToken,
  patientController.createPatientFromMobile,
);

module.exports = router;
