const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");

router.get("/all", patientController.getAllPatients);
router.post("/create", patientController.createPatient);

module.exports = router;
