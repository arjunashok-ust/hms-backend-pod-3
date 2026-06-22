const express = require("express");
const router = express.Router();

const auth = require("../middlewares/authMiddleware");
const checkPermission = require("../middlewares/checkPermission");
const PERMISSIONS = require("../constants/permissions");

const {
  createMedicalRecord,
  getMedicalRecords,
  updateMedicalRecord,
  deleteMedicalRecord,
} = require("../controllers/medicalRecordController");

/* CREATE */
router.post("/createMedicalRecord",auth,checkPermission(PERMISSIONS.CREATE_MEDICAL_RECORD),createMedicalRecord,);
/* READ */
router.get("/getMedicalRecords",auth,checkPermission(PERMISSIONS.VIEW_MEDICAL_RECORD),getMedicalRecords,);
/* UPDATE */
router.put("/updateMedicalRecord/:id",auth,checkPermission(PERMISSIONS.EDIT_MEDICAL_RECORD),updateMedicalRecord,);
/* DELETE (soft delete) */
router.delete("/deleteMedicalRecord/:id",auth,checkPermission(PERMISSIONS.DELETE_MEDICAL_RECORD),deleteMedicalRecord,);

module.exports = router;