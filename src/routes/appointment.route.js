const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const {validateCreateAppointment, validateDeleteAppointment} = require("../validations/appointment.validation");
const { createAppointment, getAllAppointments, getDoctors, deleteAppointment,
    getAppointmentUiData } = require("../controllers/appointment.controller");

router.post("/createappointment", validate, validateCreateAppointment, createAppointment);
router.get("/getallappointments", validate, getAllAppointments);
router.get("/getdoctors", validate, getDoctors);
router.get("/getappointmentuidata", validate, getAppointmentUiData);
router.delete("/deleteappointment", validate, validateDeleteAppointment, deleteAppointment);

module.exports = router;