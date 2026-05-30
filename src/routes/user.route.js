const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const authMiddleware = require("../middlewares/auth.middleware");
const { validateGetNameByEmployeeId, validateGetNameByCustomerId } = require("../validations/user.validation");
const { profile, getNameByCustomerId, getNameByEmployeeId, createPatient, getPatients, deletePatient } = require("../controllers/user.controller");

router.get("/profile", authMiddleware, validate, profile);
router.get("/getnamebycustomerid", validateGetNameByCustomerId, validate, getNameByCustomerId);
router.get("/getnamebyemployeeid", validateGetNameByEmployeeId, validate, getNameByEmployeeId);
router.post("/createpatient", validate, createPatient);
router.get("/getpatients", validate, getPatients);
router.delete("/deletepatient", validate, deletePatient);

module.exports = router;