const express = require("express");
const router = express.Router();

const { body } = require("express-validator");

const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const roleValidation = require("../middlewares/roleMiddleware");

const {
  createAppointment,
  getAllAppointments,
  deleteAppointment,
  getAppointmentUI,
  getDoctors,
} = require("../controllers/appointmentController");

/* VALIDATION */

const appointmentValidation = [
  body("patientId").notEmpty().withMessage("Patient ID required"),

  body("doctorEmployeeId").notEmpty().withMessage("Doctor ID required"),

  body("date").notEmpty().withMessage("Appointment date required"),

  body("timeSlot").notEmpty().withMessage("Time slot required"),
];

/* CREATE */

router.post(
  "/createAppointment",
  auth,
  roleValidation("admin", "receptionist","patient"),
  appointmentValidation,
  validate,
  createAppointment,
);

/* GET ALL */

router.get("/getAllAppointments", auth, getAllAppointments);

/* GET DOCTORS */

router.get("/getDoctors", auth, getDoctors);

/* DELETE */

router.delete(
  "/deleteAppointment/:appointmentId",
  auth,
  roleValidation("admin", "receptionist"),
  deleteAppointment,
);

/* UI */

router.get("/getAppointmentUI", auth, getAppointmentUI);

module.exports = router;
