const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate =require("../middleware/validate");
const auth = require("../middleware/authMiddleware");
const rolevalidate = require("../middleware/roleMiddleware");
const { addAppointment,getAllAppointments, getAppointmentUI, delAppointment, getAllDoctors, getAvailableSlots} = require("../controllers/appointmentController");

const { appointmentValidation  } = require("../validations/appointmentValidations");

router.post("/createAppointment",auth,rolevalidate("ADMIN","RECEPTIONIST"),appointmentValidation,validate, addAppointment);
router.get("/getAllAppointments", auth, rolevalidate("ADMIN", "RECEPTIONIST"), validate, getAllAppointments);
router.get("/getUI", auth, rolevalidate("ADMIN", "RECEPTIONIST"), validate, getAppointmentUI );
router.get("/getDoctors", auth, rolevalidate("ADMIN", "RECEPTIONIST"), validate, getAllDoctors );
router.delete("/deleteAppointment", auth, rolevalidate("ADMIN", "RECEPTIONIST"), validate, delAppointment);
router.get("/availableSlots",auth,rolevalidate("ADMIN","RECEPTIONIST"),validate, getAvailableSlots);
module.exports = router; 