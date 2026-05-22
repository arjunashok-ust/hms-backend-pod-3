const express = require('express');
const router = express.Router();

const appointmentValidate = require('../validation/appointment.validate');
const appointmentController = require('../controller/appointment.controller');
const validate = require('../middleware/validate.middleware');

router.post('/createAppointment',appointmentValidate.validateCreateAppointment,validate,appointmentController.createAppointment);
router.get('/getAllAppointments',validate,appointmentController.getAllAppointments);
router.get('/getDoctors',validate,appointmentController.getDoctors);
router.get('/getAppointmentUiData',validate,appointmentController.getAppointmentUiData);
router.get('/deleteAppointment',appointmentValidate.validateDeleteAppointment,validate,appointmentController.deleteAppointment);

module.exports = router;