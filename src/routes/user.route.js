const express = require('express');
const router = express.Router();

const userController = require('../controller/user.controller');
const userValidate = require('../validation/user.validate');
const validate = require('../middleware/validate.middleware');
const auth = require('../middleware/auth.middleware');

// routes
router.get('/getUserProfile',userValidate.validateGetUserProfile,validate,auth,userController.getUserProfile);
router.post('/createPatient', userValidate.validateCreatePatient,validate,auth,userController.createPatient);
router.get('/getPatients',validate,auth,userController.getPatients);
router.post('/deletePatient',userValidate.validateDeletePatient,validate,auth,userController.deletePatient);

module.exports = router;