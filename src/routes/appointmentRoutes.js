const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");

const {authenticateToken} = require("../middlewares/authMiddleware"); 

const appointmentController = require("../controllers/appointmentController");

router.post("/create", authenticateToken, appointmentController.addAppointment);
router.get("/stats", authenticateToken, appointmentController.getAppointmentStats);
router.get("/doctors", authenticateToken, appointmentController.getDoctorsList);
router.get("/recent", authenticateToken, appointmentController.getRecentAppointments);
router.put("/:id", authenticateToken, appointmentController.updateAppointment);
router.get("/slots", authenticateToken, appointmentController.getAvailableSlots);
router.delete("/:id", authenticateToken, appointmentController.deleteAppointment);

module.exports = router;