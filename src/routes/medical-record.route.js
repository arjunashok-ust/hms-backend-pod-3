const express = require('express');
const router = express.Router();

const validate = require('../middleware/validate.middleware');
const validateUser = require('../validation/user.validate');
const auth = require('../middleware/auth.middleware');
const permission = require('../middleware/permission.middleware');
const medicalRecordValidate = require('../validation/medical-record.validate');

const medicalRecordController = require('../controller/medical-record.controller');

router.post('/createMedicalRecord', medicalRecordValidate.validateCreateMedicalRecord, validate, auth, permission(['create:medical-record']), medicalRecordController.createMedicalRecord);
router.post('/updateMedicalRecord', medicalRecordValidate.validateCreateMedicalRecord, validate, auth, permission(['edit:medical-record']), medicalRecordController.updateMedicalRecord);
router.get('/getMedicalRecordStats', auth, permission(['view:medical-record']), medicalRecordController.getMedicalRecordStats);
router.get('/getMedicalRecords', validateUser.validatePagination, medicalRecordValidate.validateGetMedicalRecords, validate, auth, permission(['view:medical-record']), medicalRecordController.getMedicalRecords);
router.get('/getMedicalRecordById', medicalRecordValidate.validateGetMedicalRecordById, validate, auth, permission(['view:medical-record']), medicalRecordController.getMedicalRecordById);
router.post('/deleteMedicalRecord', medicalRecordValidate.validateDeleteMedicalRecord, validate, auth, permission(['delete:medical-record']), medicalRecordController.deleteMedicalRecord);

module.exports = router;