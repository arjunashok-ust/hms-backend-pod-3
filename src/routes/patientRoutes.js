const express = require("express");
const router = express.Router();

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

router.post("/createPatient", auth, checkPermission(PERMISSIONS.CREATE_PATIENT), createPatient);
router.get("/getAllPatients", auth, checkPermission(PERMISSIONS.VIEW_PATIENT), getAllPatients);
router.get("/getSinglePatient/:id", auth, checkPermission(PERMISSIONS.VIEW_PATIENT), getSinglePatient);
router.get("/getPatientUI", auth, checkPermission(PERMISSIONS.VIEW_PATIENT_STAT), getPatientUI);
router.put("/updatePatient/:id", auth, checkPermission(PERMISSIONS.EDIT_PATIENT), updatePatient);
router.delete("/deletePatient/:id", auth, checkPermission(PERMISSIONS.DELETE_PATIENT), deletePatient);

module.exports = router;