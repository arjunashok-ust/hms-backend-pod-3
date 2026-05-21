const express = require('express');
const router = express.Router();

const adminController = require('../controller/admin.controller');
const validateAdmin = require('../validation/admin.validate');
const validate = require('../middleware/validate.middleware');
const auth = require('../middleware/auth.middleware');

router.post('/deleteUserProfile', validateAdmin.validateDeleteUserProfile, validate, auth, adminController.deleteUserProfile);
router.get('/getDashBoardData',validate,adminController.getDashboardData);
router.get('/getAllUsers',validate,adminController.getAllUsers);

module.exports = router;