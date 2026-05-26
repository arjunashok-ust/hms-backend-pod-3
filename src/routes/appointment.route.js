const express = require('express');
const router = express.Router();

const appointmentValidate = require('../validation/appointment.validate');
const appointmentController = require('../controller/appointment.controller');
const validate = require('../middleware/validate.middleware');
const auth = require('../middleware/auth.middleware');

router.post('/createAppointment',appointmentValidate.validateCreateAppointment,validate,auth,appointmentController.createAppointment);
router.get('/getAllAppointments',validate,auth,appointmentController.getAllAppointments);
router.get('/getDoctors',validate,auth,appointmentController.getDoctors);
router.get('/getAppointmentUiData',validate,auth,appointmentController.getAppointmentUiData);
router.get('/deleteAppointment',appointmentValidate.validateDeleteAppointment,validate,auth,appointmentController.deleteAppointment);

module.exports = router;