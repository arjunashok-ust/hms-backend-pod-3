const validate = require('../middleware/validate.middleware');
const express = require('express');
const router = express.Router(); 

const authController = require('../controller/auth.controller');
const authValidate = require('../validation/auth.validate');

// sign up
router.post('/signUp',authValidate.validateSignUp,validate,authController.signUp);
router.post('/login',authValidate.validateLogin,validate,authController.login);
router.get('/getRoles',authController.getRoles);
router.get('/getDepartments',authController.getDepartments);
router.get('/getSpecializations',authController.getSpecializations);

module.exports = router;