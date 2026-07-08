const validate = require('../middleware/validate.middleware');
const express = require('express');
const router = express.Router();

const authController = require('../controller/auth.controller');
const authValidate = require('../validation/auth.validate');
const auth = require('../middleware/auth.middleware');

router.post('/signUp', authValidate.validateSignUp, validate, authController.signUp);
router.post('/login', authValidate.validateLogin, validate, authController.login);
router.post('/set-password', authValidate.validateSetPassword, validate, authController.setPassword);
router.get('/verify-email', authValidate.validateVerifyMail, validate, authController.verifyMail);
router.post('/patientSignUp', authValidate.validatePatientSignUp, validate, authController.patientSignUp);
router.get('/getPermissions', authValidate.validateGetPermissions, validate, authController.getPermissions);
router.get('/refresh-token', authController.getAccessToken);
router.post('/reset-password', authValidate.validateResetPassword, validate, authController.resetPassword);
router.get('/verify-reset-password', authValidate.validateVerifyResetPassword, validate, authController.verifyResetPassword);
router.get('/logout', auth, authController.logout);

module.exports = router;