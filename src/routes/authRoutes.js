const express = require("express");
const router = express.Router();
 
const authController = require('../controller/authcontroller');
const authValidation = require('../validators/authValidator');
const validate = require('../middleware/validate');
const { auth } = require('../middleware/authMiddleware');
 
router.post('/signup',authValidation.signupValidation,validate,authController.signup);
router.post('/login',authValidation.loginValidation,validate, authController.login);
router.get('/profile',auth,authController.getProfile)
 
module.exports = router;