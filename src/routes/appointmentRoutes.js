const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const { authenticateToken } = require("../middlewares/authMiddleware");
const appointmentController = require("../controllers/appointmentController");
const requirePermission = require("../middlewares/permissionMiddleware");

router.post(
  "/create",
  authenticateToken,
  requirePermission("CREATE_APPOINTMENT"),
  appointmentController.addAppointment,
);
router.get(
  "/stats",
  authenticateToken,
  requirePermission("VIEW_APPOINTMENT_STATS"),
  appointmentController.getAppointmentStats,
);
router.get(
  "/doctors",
  authenticateToken,
  requirePermission(['VIEW_EMPLOYEES', 'CREATE_APPOINTMENT_FOR_SELF']),
  appointmentController.getDoctorsList,
);
router.get(
  "/recent",
  authenticateToken,
  requirePermission(['CREATE_APPOINTMENT_FOR_SELF','VIEW_ALL_APPOINTMENTS']),
  appointmentController.getRecentAppointments,
);
router.put(
  "/:id",
  authenticateToken,
  requirePermission("UPDATE_APPOINTMENT"),
  appointmentController.updateAppointment,
);
router.get(
  "/slots",
  authenticateToken,
  requirePermission("['VIEW_MY_APPOINTMENTS','VIEW_ALL_APPOINTMENTS']"),
  appointmentController.getAvailableSlots,
);
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("DELETE_APPOINTMENT"),
  appointmentController.deleteAppointment,
);

router.get(
  "/my-appointments",
  authenticateToken,
  requirePermission("['VIEW_MY_APPOINTMENTS','VIEW_ALL_APPOINTMENTS']"),
  appointmentController.getPatientAppointments,
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
  appointmentController.getAllAppointments,
);

module.exports = router;
