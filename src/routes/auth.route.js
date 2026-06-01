const validate = require('../middleware/validate.middleware');
const express = require('express');
const router = express.Router(); 

const authController = require('../controller/auth.controller');
const authValidate = require('../validation/auth.validate');
const auth = require('../middleware/auth.middleware');
const permission = require('../middleware/permission.middleware')

// sign up
router.post('/signUp',authValidate.validateSignUp,validate,authController.signUp);
router.post('/login',authValidate.validateLogin,validate,authController.login);
router.post('/set-password',authValidate.validateSetPassword,validate,auth,authController.setPassword);
router.get('/verify-email',authValidate.validateVerifyMail,validate,authController.verifyMail);
router.post('/patientSignUp',authValidate.validatePatientSignUp,validate,authController.patientSignUp);

module.exports = router;