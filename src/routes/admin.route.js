const express = require('express');
const router = express.Router();

const adminController = require('../controller/admin.controller');
const validateAdmin = require('../validation/admin.validate');
const validate = require('../middleware/validate.middleware');
const auth = require('../middleware/auth.middleware');


router.post('/deleteUserProfile', validateAdmin.validateDeleteUserProfile, validate, auth, adminController.deleteUserProfile);
router.get('/getDashBoardData', validate, auth, adminController.getDashboardData);
router.get('/getAllUsers', validate, auth, adminController.getAllUsers);
router.get('/getUsers', validate, auth, adminController.getUsers);
router.post('/approveUser', validateAdmin.validateApproveUser, validate, auth, adminController.approveUser);
router.post('/rejectUser', validateAdmin.validateRejectUser, validate, auth, adminController.rejectUser);
router.post('/updateUserProfile', validate, auth, adminController.updateUserProfile);

module.exports = router;