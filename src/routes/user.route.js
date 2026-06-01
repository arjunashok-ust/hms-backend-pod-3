const express = require('express');
const router = express.Router();

const userController = require('../controller/user.controller');
const userValidate = require('../validation/user.validate');
const validate = require('../middleware/validate.middleware');
const auth = require('../middleware/auth.middleware');
const permission = require('../middleware/permission.middleware');

// routes
router.get('/getUserProfile',userValidate.validateGetUserProfile,validate,auth,permission('view:profile'),userController.getUserProfile);
router.post('/createPatient', userValidate.validateCreatePatient,validate,auth,permission('view:patient'),userController.createPatient);
router.get('/getPatients',auth,permission('view:patient'),userController.getPatients);
router.post('/deletePatient',userValidate.validateDeletePatient,validate,auth,permission('view:patient'),userController.deletePatient);

module.exports = router;