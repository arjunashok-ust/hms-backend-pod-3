const { router, permissionProcedure } = require('../trpc');
const medicalRecordService = require('../../services/medical-record.service');
const { PERMISSIONS: P } = require('../../constants/permissions.constants');
const schema = require('../schemas/medical-record.schema');

const medicalRecordRouter = router({
    createMedicalRecord: permissionProcedure(P.CREATE_MEDICAL_RECORD)
        .input(schema.createMedicalRecordInput)
        .output(schema.createMedicalRecordOutput)
        .mutation(({ input, ctx }) => medicalRecordService.createMedicalRecord(ctx.user, input)),

    updateMedicalRecord: permissionProcedure(P.EDIT_MEDICAL_RECORD)
        .input(schema.updateMedicalRecordInput)
        .output(schema.messageOutput)
        .mutation(({ input, ctx }) => medicalRecordService.updateMedicalRecord(ctx.user, input)),

    getMedicalRecordStats: permissionProcedure(P.VIEW_MEDICAL_RECORD)
        .output(schema.medicalRecordStatsOutput)
        .query(() => medicalRecordService.getMedicalRecordStats()),

    getMedicalRecords: permissionProcedure(P.VIEW_MEDICAL_RECORD)
        .input(schema.getMedicalRecordsInput)
        .output(schema.getMedicalRecordsOutput)
        .query(({ input, ctx }) => medicalRecordService.getMedicalRecords(ctx.user, input)),

    getMedicalRecordById: permissionProcedure(P.VIEW_MEDICAL_RECORD)
        .input(schema.getMedicalRecordByIdInput)
        .output(schema.medicalRecordSchema)
        .query(({ input, ctx }) => medicalRecordService.getMedicalRecordById(ctx.user, input)),

    deleteMedicalRecord: permissionProcedure(P.DELETE_MEDICAL_RECORD)
        .input(schema.deleteMedicalRecordInput)
        .output(schema.messageOutput)
        .mutation(({ input, ctx }) => medicalRecordService.deleteMedicalRecord(ctx.user, input)),
});

module.exports = { medicalRecordRouter };
