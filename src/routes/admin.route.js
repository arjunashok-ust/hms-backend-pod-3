const express = require('express');
const router = express.Router();

const adminController = require('../controller/admin.controller');
const validateAdmin = require('../validation/admin.validate');
const validate = require('../middleware/validate.middleware');
const auth = require('../middleware/auth.middleware');
const permission = require('../middleware/permission.middleware');


router.post('/deleteUserProfile', validateAdmin.validateDeleteUserProfile, validate, auth, permission('delete:employee'), adminController.deleteUserProfile);
router.get('/getDashBoardData', validate, auth, permission('view:dashboard'), adminController.getDashboardData);
router.get('/getAllUsers', validate, auth,permission('view:appointment'), adminController.getAllUsers);
router.get('/getUsers', validate, auth,permission('view:appointment'), adminController.getUsers);
router.post('/approveUser', validateAdmin.validateApproveUser, validate, auth, permission('approve:user'), adminController.approveUser);
router.post('/rejectUser', validateAdmin.validateRejectUser, validate, auth, permission('reject:user'), adminController.rejectUser);
router.post('/updateUserProfile', validate, auth, permission('edit:employee'), adminController.updateUserProfile);

module.exports = router;