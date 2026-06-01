const express = require('express');
const router = express.Router();

const appointmentValidate = require('../validation/appointment.validate');
const appointmentController = require('../controller/appointment.controller');
const validate = require('../middleware/validate.middleware');
const auth = require('../middleware/auth.middleware');
const permission = require('../middleware/permission.middleware');

router.post('/createAppointment',appointmentValidate.validateCreateAppointment,validate,auth,permission('view:appointment'),appointmentController.createAppointment);
router.get('/getAllAppointments',auth,permission('view:appointment'),appointmentController.getAllAppointments);
router.get('/getDoctors',auth,permission('view:appointment'),appointmentController.getDoctors);
router.get('/getAppointmentUiData',auth,permission('view:appointment'),appointmentController.getAppointmentUiData);
router.get('/deleteAppointment',appointmentValidate.validateDeleteAppointment,validate,auth,permission('view:appointment'),appointmentController.deleteAppointment);

module.exports = router;