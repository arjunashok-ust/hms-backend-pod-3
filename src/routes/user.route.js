const express = require('express');
const router = express.Router();

const userController = require('../controller/user.controller');
const userValidate = require('../validation/user.validate');
const validate = require('../middleware/validate.middleware');
const auth = require('../middleware/auth.middleware');
const permission = require('../middleware/permission.middleware');

// routes
router.get('/getUserProfile', userValidate.validateGetUserProfile, validate, auth, permission('view:profile'), userController.getUserProfile);
router.get('/getPatients', userValidate.validatePagination, validate, auth, permission('view:patient'), userController.getPatients);
router.post('/deletePatient', userValidate.validateDeletePatient, validate, auth, permission('view:patient'), userController.deletePatient);
router.get('/getPatientProfile', userValidate.validateGetPatientProfile, validate, auth, permission('view:patient'), userController.getPatientProfile);
router.get('/getPatientId', userValidate.validateGetPatientId, validate, auth, permission('view:profile'), userController.getPatientId);
router.get('/getAvailableTimeSlots', userValidate.validateGetAvailableTimeSlots, validate, auth, permission('view:profile'), userController.getAvailableTimeSlots);
router.post('/updatePatientProfile', userValidate.validateUpdatePatientProfile, validate, auth, permission('edit:profile'), userController.updatePatientProfile);
router.get('/getPatientsBySearch', userValidate.validateGetPatientsBySearch, validate, auth, permission('view:patient'), userController.getPatientsBySearch);
router.get('/getDoctorsBySearch', userValidate.validateGetDoctorsBySearch, validate, auth, permission('view:profile'), userController.getDoctorsBySearch);
router.get('/getPatientById', userValidate.validateGetPatientById, validate, auth, permission('view:profile'), userController.getPatientById);
router.get('/getDoctorById', userValidate.validateGetDoctorById, validate, auth, permission('view:profile'), userController.getDoctorById);
router.get('/getSingleUser', userValidate.validateGetSingleUser, validate, auth, permission("view:profile"), userController.getSingleUser);

module.exports = router;