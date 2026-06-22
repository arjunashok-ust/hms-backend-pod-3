const express = require("express");
const router = express.Router();

const { body } = require("express-validator");

const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const checkPermission = require("../middlewares/checkPermission");
const PERMISSIONS = require("../constants/permissions");

const {
  createAppointment,
  getAllAppointments,
  deleteAppointment,
  getAppointmentUI,
  getDoctors,
  approveAppointment,
  rejectAppointment,
  updateAppointment,
} = require("../controllers/appointmentController");

/* VALIDATION */
const appointmentValidation = [
  body("patientId").notEmpty().withMessage("Patient ID required"),
  body("doctorEmployeeId").notEmpty().withMessage("Doctor ID required"),
  body("date").notEmpty().withMessage("Appointment date required"),
  body("timeSlot").notEmpty().withMessage("Time slot required"),
];

/* CREATE */
router.post("/createAppointment",auth,checkPermission(PERMISSIONS.CREATE_APPOINTMENT),appointmentValidation,validate,createAppointment,);

/* READ */
router.get("/getAllAppointments",auth,checkPermission(PERMISSIONS.VIEW_APPOINTMENT),getAllAppointments,);
router.get("/getDoctors",auth,checkPermission(PERMISSIONS.VIEW_EMPLOYEE),getDoctors,);

/* DELETE */
router.delete("/deleteAppointment/:appointmentId",auth,checkPermission(PERMISSIONS.DELETE_APPOINTMENT),deleteAppointment,);

/* UI / STATS */
router.get("/getAppointmentUI",auth,checkPermission(PERMISSIONS.VIEW_APPOINTMENT_STAT),getAppointmentUI,);

/* UPDATE */
router.put("/updateAppointment/:appointmentId",auth,checkPermission(PERMISSIONS.EDIT_APPOINTMENT),appointmentValidation,validate,updateAppointment,);
/* WORKFLOW */
router.put("/approveAppointment/:appointmentId",auth,checkPermission(PERMISSIONS.APPROVE_APPOINTMENT),approveAppointment,);
router.put("/rejectAppointment/:appointmentId",auth,checkPermission(PERMISSIONS.REJECT_APPOINTMENT),rejectAppointment,);

module.exports = router;
