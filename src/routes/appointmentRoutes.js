const express = require("express");
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const controller = require('../controller/appointmentController');


router.get('/', auth, controller.getAllAppointments);


router.delete('/:id', auth, controller.deleteAppointment);

module.exports = router;
