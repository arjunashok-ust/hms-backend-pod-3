const express = require("express");

const router = express.Router();

const auth =
  require("../middlewares/authMiddleware");

const {
  patientSignup,
  patientLogin,
  updatePatientProfile,
  getAllDoctors,
} = require(
  "../controllers/patientAppAuthController"
);

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

module.exports = router;