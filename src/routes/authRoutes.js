const express = require("express");
const router = express.Router();
 
const authController = require('../controller/authcontroller');
const authValidation = require('../validators/authValidator');
const validate = require('../middleware/validate');
const  auth  = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');
const patient = require('../controller/patientController');
const Appointment = require('../controller/appointmentController');

router.post(
  "/signup",
  auth,
  isAdmin,
  authController.signup
);
//router.post('/signup',authValidation.signupValidation,validate,authController.signup);
router.post('/login',authValidation.loginValidation,validate, authController.login);
router.get('/profile',auth,authController.getProfile)
//router.delete('/delete/:employeeCode',auth,authController.deleteEmployee );
//router.put('/updateUser',auth, authController.updateUser);
 //router.post('/formSignup', authValidation.signupValidation,validate,authController.formSignUp)
router.post('/signupAdmin',auth,authValidation.signupValidation, validate,authController.signUpAdmin );
//router.get("/verify-email",authController.verifyMail);
//router.post("/create-patient", auth, patient.createPatient);
//router.post('/create', auth , Appointment.createAppointment);   
module.exports = router;