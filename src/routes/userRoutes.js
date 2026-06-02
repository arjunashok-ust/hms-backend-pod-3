const express = require("express");
const router = express.Router();
const { body, query } = require("express-validator");
const validate =require("../middleware/validate");
const auth = require("../middleware/authMiddleware");
const rolevalidate = require("../middleware/roleMiddleware");
const { currentUser, getNameByEmployeeId, getNameByPatientId} = require("../controllers/userController");

const { getNameByEmployeeIdValidation, getNameByPatientIdValidation} = require("../validations/userValidations");


router.get('/getcurrent',auth, validate,currentUser);
router.get('/getNameByEmployeeId',getNameByEmployeeIdValidation,validate,getNameByEmployeeId);
router.get('/getNameByPatientId',getNameByPatientIdValidation,validate,getNameByPatientId);

module.exports = router;
