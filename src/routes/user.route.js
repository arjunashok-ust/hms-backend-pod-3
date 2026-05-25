const express = require('express');
const router = express.Router();

const userController = require('../controller/user.controller');
const userValidate = require('../validation/user.validate');
const validate = require('../middleware/validate.middleware');
const auth = require('../middleware/auth.middleware');

// routes
router.get('/getUserProfile',userValidate.validateGetUserProfile,validate,userController.getUserProfile);
router.get('/getNameByEmployeeId',userValidate.validateGetNameByEmployeeId,validate,userController.getNameByEmployeeId);
router.get('/getNameByPatientId',userValidate.validateGetNameByPatientId,validate,userController.getNameByPatientId);
router.post('/createPatient', userValidate.validateCreatePatient,validate,userController.createPatient);
router.get('/getPatients',validate,auth,userController.getPatients);
router.post('/deletePatient',userValidate.validateDeletePatient,validate,userController.deletePatient);

module.exports = router;