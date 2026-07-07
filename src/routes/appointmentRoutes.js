/**
 * @file appointmentRoutes.js
 * @description
 * This file defines the API routes for all appointment-related operations.
 *
 * @overview
 * This router handles endpoints for creating, retrieving, updating, and deleting appointments.
 * It uses middleware for authentication (`authenticateToken`), permission checking (`requirePermission`), and handling asynchronous operations (`asyncHandler`).
 * A typical request flows through: API Request -> APPOINTMENTROUTES.JS -> authenticateToken -> requirePermission -> asyncHandler -> appointmentController -> Model(s).
 * Any errors are caught by `asyncHandler` and passed to the global `errorMiddleware`.
 *
 * Connections:
 *   API Request -> APPOINTMENTROUTES.JS -> [authenticateToken, requirePermission, validate] -> asyncHandler -> appointmentController -> [Appointments, Employees, Patients] Models
 */
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const { authenticateToken } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");
const appointmentController = require("../controllers/appointmentController");
const requirePermission = require("../middlewares/permissionMiddleware");

router.post(
  "/create",
  authenticateToken,
  requirePermission([
    "CREATE_APPOINTMENT_FOR_ANY_DOCTOR",
    "CREATE_APPOINTMENT_FOR_SELF",
  ]),
  asyncHandler(appointmentController.addAppointment),
);
router.get(
  "/stats",
  authenticateToken,
  requirePermission("VIEW_APPOINTMENT_STATS"),
  asyncHandler(appointmentController.getAppointmentStats),
);
router.get(
  "/doctors",
  authenticateToken,
  requirePermission(["VIEW_EMPLOYEES", "CREATE_APPOINTMENT_FOR_SELF"]),
  asyncHandler(appointmentController.getDoctorsList),
);
router.get(
  "/recent",
  authenticateToken,
  requirePermission(["CREATE_APPOINTMENT_FOR_SELF", "VIEW_ALL_APPOINTMENTS"]),
  asyncHandler(appointmentController.getRecentAppointments),
);
router.put(
  "/:id",
  authenticateToken,
  requirePermission(["UPDATE_APPOINTMENT", "UPDATE_MY_APPOINTMENT"]),
  asyncHandler(appointmentController.updateAppointment),
);
router.get(
  "/slots",
  authenticateToken,
  requirePermission(["VIEW_MY_APPOINTMENTS", "VIEW_ALL_APPOINTMENTS"]),
  asyncHandler(appointmentController.getAvailableSlots),
);
router.delete(
  "/:id",
  authenticateToken,
  requirePermission(["DELETE_APPOINTMENT", "DELETE_MY_APPOINTMENT"]),
  asyncHandler(appointmentController.deleteAppointment),
);

router.get(
  "/my-appointments",
  authenticateToken,
  requirePermission(["VIEW_MY_APPOINTMENTS", "VIEW_ALL_APPOINTMENTS"]),
  asyncHandler(appointmentController.getPatientAppointments),
);

router.get(
  "/all",
  authenticateToken,
  requirePermission([
    "VIEW_ALL_APPOINTMENTS",
    "VIEW_MY_APPOINTMENTS",
    "CREATE_RECORD_FOR_ANYONE",
    "CREATE_MY_RECORD",
  ]),
  asyncHandler(appointmentController.getAllAppointments),
);

module.exports = router;
