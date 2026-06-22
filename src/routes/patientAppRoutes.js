const express = require("express");

const router = express.Router();

const auth = require("../middlewares/authMiddleware");
const roleValidation = require("../middlewares/roleMiddleware");

const {
  patientSignup,
  patientLogin,
  updatePatientProfile,
  getAllDoctors,
} = require("../controllers/patientAppAuthController");

const {
  createPatientAppointment,
  getPatientAppointments,
  cancelAppointment,
  getAvailableSlots,
} = require("../controllers/patientAppAppointmentController");

const {
  getMyMedicalRecords,
} = require("../controllers/patientAppMedicalRecordController");

/* PUBLIC */
router.post("/signup", patientSignup);
router.post("/login", patientLogin);
router.get("/getAllDoctors", getAllDoctors);
router.get("/availableSlots/:doctorEmployeeId/:date", getAvailableSlots);

/* PATIENT-ONLY (self-service) */
router.put("/updateProfile", auth, roleValidation("patient"), updatePatientProfile);
router.get("/getAppointments", auth, roleValidation("patient"), getPatientAppointments);
router.post("/createAppointment", auth, roleValidation("patient"), createPatientAppointment);
router.put("/cancelAppointment/:id", auth, roleValidation("patient"), cancelAppointment);
router.get("/medicalRecords", auth, roleValidation("patient"), getMyMedicalRecords);

module.exports = router;