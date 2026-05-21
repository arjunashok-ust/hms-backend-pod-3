const validate = require('../middleware/validate.middleware');
const express = require('express');
const router = express.Router(); 

const authController = require('../controller/auth.controller');
const authValidate = require('../validation/auth.validate');

// sign up
router.post('/signUp',authValidate.validateSignUp,validate,authController.signUp);
router.post('/login',authValidate.validateLogin,validate,authController.login);
router.post('/signUpAdmin',authValidate.validateSignUp,validate,authController.signUpAdmin);
router.post('/reset-password',authValidate.validateResetPassword,validate,authController.resetPassword);
router.post('/refresh',authValidate.validateRefresh,validate,authController.refresh);
router.post('/set-password',authValidate.validateSetPassword,validate,authController.setPassword);
router.get('/verify-email',authValidate.validateVerifyMail,validate,authController.verifyMail);

module.exports = router;