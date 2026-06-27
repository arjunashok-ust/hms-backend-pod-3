const express = require("express");

const router = express.Router();

const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");


const {
  patientSignup,
  patientLogin,
  patientRefresh,
  patientLogout,
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

/* VALIDATION */
const patientSignupValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required").isLength({ min: 8 }).withMessage("At least 8 character password required"),
  body("phone").notEmpty().withMessage("Phone number is required"),
  body("gender").notEmpty().withMessage("Gender is required"),
];

const patientLoginValidation = [
  body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const patientAppointmentValidation = [
  body("doctorEmployeeId").notEmpty().withMessage("Doctor is required"),
  body("date").notEmpty().withMessage("Appointment date required"),
  body("timeSlot").notEmpty().withMessage("Time slot required"),
];

const updatePatientProfileValidation = [
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("phone").optional().notEmpty().withMessage("Phone cannot be empty"),
  body("email").optional().isEmail().withMessage("Valid email required"),
];

/* PUBLIC */
router.post("/signup", patientSignupValidation, validate, patientSignup);
router.post("/login", patientLoginValidation, validate, patientLogin);
/* Refresh is public: the access token is expired by definition; the refresh
   token in the body is the credential. */
router.post("/refresh", patientRefresh);
router.get("/getAllDoctors", getAllDoctors);
router.get("/availableSlots/:doctorEmployeeId/:date", getAvailableSlots);

/* PATIENT-ONLY (self-service) */
router.post("/logout", auth, patientLogout);
router.put("/updateProfile", auth,  updatePatientProfileValidation, validate, updatePatientProfile);
router.get("/getAppointments", auth, getPatientAppointments);
router.post("/createAppointment", auth,  patientAppointmentValidation, validate, createPatientAppointment);
router.put("/cancelAppointment/:id", auth, cancelAppointment);
router.get("/medicalRecords", auth, getMyMedicalRecords);

module.exports = router;