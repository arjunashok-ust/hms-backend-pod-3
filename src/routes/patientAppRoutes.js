const express = require("express");

const router = express.Router();

const auth =
  require("../middlewares/authMiddleware");

const {
  patientSignup,
  patientLogin,
  updatePatientProfile,
  getAllDoctors,
  
} = require("../controllers/patientAppAuthController");

const{ createPatientAppointment,getPatientAppointments}=require("../controllers/patientAppAppointmentController");

router.post(
  "/signup",
  patientSignup
);

router.post(
  "/login",
  patientLogin
);

router.put(
  "/updateProfile",
  auth,
  updatePatientProfile
);

router.get(
  "/getAllDoctors",
  getAllDoctors
);
router.get(
  "/getAppointments",
  auth,
  getPatientAppointments
);
router.post(
  "/createAppointment",
  auth,
  createPatientAppointment
);

module.exports = router;