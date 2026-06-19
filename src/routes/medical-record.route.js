const express = require('express');
const router = express.Router();

const validate = require('../middleware/validate.middleware');
const auth = require('../middleware/auth.middleware');
const permission = require('../middleware/permission.middleware');
const medicalRecordValidate = require('../validation/medical-record.validate');

const medicalRecordController = require('../controller/medical-record.controller');

router.post('/createMedicalRecord', medicalRecordValidate.validateCreateMedicalRecord, validate, auth, medicalRecordController.createMedicalRecord);
router.get('/getMedicalRecordStats', auth, permission(['view:medical-record']), medicalRecordController.getMedicalRecordStats);
router.get('/getMedicalRecords', medicalRecordValidate.validateGetMedicalRecords, validate, auth, permission(['view:medical-record']), medicalRecordController.getMedicalRecords);
router.get('/getMedicalRecordById', medicalRecordValidate.validateGetMedicalRecordById, validate, auth, permission(['view:medical-record']), medicalRecordController.getMedicalRecordById);

module.exports = router;