const express = require('express');
const router = express.Router();

const adminController = require('../controller/admin.controller');
const validateAdmin = require('../validation/admin.validate');
const validate = require('../middleware/validate.middleware');
const auth = require('../middleware/auth.middleware');
const permission = require('../middleware/permission.middleware');


router.post('/deleteUserProfile', validateAdmin.validateDeleteUserProfile, validate, auth, permission('view:employee'), adminController.deleteUserProfile);
router.get('/getDashBoardData', auth, permission('view:dashboard'), adminController.getDashboardData);
router.get('/getAllUsers', auth,permission('view:dashboard'), adminController.getAllUsers);
router.get('/getUsers', auth,permission('view:dashboard'), adminController.getUsers);
router.get('/getUserEmployee', auth,permission('view:dashboard'), adminController.getUserEmployee);
router.post('/approveUser', validateAdmin.validateApproveUser, validate, auth, permission('view:approval'), adminController.approveUser);
router.post('/rejectUser', validateAdmin.validateRejectUser, validate, auth, permission('view:approval'), adminController.rejectUser);
router.post('/updateUserProfile',auth, permission('view:employee'), adminController.updateUserProfile);

module.exports = router;