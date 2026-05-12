const express = require('express');
const router = express.Router();

const userController = require('../controller/user.controller');
const userValidate = require('../validation/user.validate');
const validate = require('../middleware/validate.middleware');
const auth = require('../middleware/auth.middleware');

// routes
router.post('/getUserProfile', userValidate.validateGetUserProfile, validate, auth, userController.getUserProfile);

module.exports = router;