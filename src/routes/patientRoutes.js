const express = require("express");
const router = express.Router();

const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const checkPermission = require("../middlewares/checkPermission");
const PERMISSIONS = require("../constants/permissions");

const {
  createPatient,
  getAllPatients,
  updatePatient,
  deletePatient,
  getSinglePatient,
  getPatientUI,
} = require("../controllers/patientController");

/* VALIDATION — mirrors the staff-side Patients form, which never collects email */
const patientValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("phone").notEmpty().withMessage("Phone number is required"),
  body("gender").notEmpty().withMessage("Gender is required"),
  body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Valid email required"),
  body("date_of_birth").optional({ checkFalsy: true }).isISO8601().withMessage("Valid date of birth required"),
];

router.post("/createPatient", auth, checkPermission(PERMISSIONS.CREATE_PATIENT), patientValidation, validate, createPatient);
router.get("/getAllPatients", auth, checkPermission(PERMISSIONS.VIEW_PATIENT), getAllPatients);
router.get("/getSinglePatient/:id", auth, checkPermission(PERMISSIONS.VIEW_PATIENT), getSinglePatient);
router.get("/getPatientUI", auth, checkPermission(PERMISSIONS.VIEW_PATIENT_STAT), getPatientUI);
router.put("/updatePatient/:id", auth, checkPermission(PERMISSIONS.EDIT_PATIENT), patientValidation, validate, updatePatient);
router.delete("/deletePatient/:id", auth, checkPermission(PERMISSIONS.DELETE_PATIENT), deletePatient);

module.exports = router;