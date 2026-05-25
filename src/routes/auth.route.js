const validate = require('../middleware/validate.middleware');
const express = require('express');
const router = express.Router(); 

const authController = require('../controller/auth.controller');
const authValidate = require('../validation/auth.validate');
const auth = require('../middleware/auth.middleware');

// sign up
router.post('/signUp',authValidate.validateSignUp,validate,authController.signUp);
router.post('/login',authValidate.validateLogin,validate,authController.login);
router.post('/signUpAdmin',authValidate.validateAdminSignUp,validate,auth,authController.signUpAdmin);
router.post('/reset-password',authValidate.validateResetPassword,validate,auth,authController.resetPassword);
router.post('/set-password',authValidate.validateSetPassword,validate,auth,authController.setPassword);
router.get('/verify-email',authValidate.validateVerifyMail,validate,authController.verifyMail);

module.exports = router;