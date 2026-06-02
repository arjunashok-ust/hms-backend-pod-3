const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const validate = require("../middleware/validate");
const auth = require("../middleware/authMiddleware");
const rolevalidate = require("../middleware/roleMiddleware");

const {createPatient, getAllPatients,getSinglePatient, updatePatient, deletePatient, getPatientUI} = require("../controllers/patientController");
const { createPatientValidation, patientIdValidation} = require("../validations/patientValidations");


router.post("/createPatient",auth,rolevalidate("ADMIN", "RECEPTIONIST"),createPatientValidation,validate,createPatient);
router.get("/getAllPatients", auth, rolevalidate("ADMIN", "RECEPTIONIST", "DOCTOR"), validate, getAllPatients);
router.get("/getSinglePatient/:patientId", auth, rolevalidate("ADMIN", "RECEPTIONIST", "DOCTOR"), patientIdValidation, validate, getSinglePatient);
router.put("/updatePatient/:patientId", auth, rolevalidate("ADMIN", "RECEPTIONIST"), patientIdValidation, validate, updatePatient);
router.delete("/deletePatient/:patientId", auth, rolevalidate("ADMIN"), patientIdValidation, validate, deletePatient);
router.get("/getPatientUI", auth, rolevalidate("ADMIN", "RECEPTIONIST"), validate, getPatientUI);
module.exports = router;