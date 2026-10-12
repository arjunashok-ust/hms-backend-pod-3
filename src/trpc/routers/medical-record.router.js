const { router, protectedProcedure, requirePermission } = require('../trpc');
const MedicalRecord = require('../../models/medical-record.model');
const ERR = require('../../utils/errors.utils');
const {
    getMedicalRecordsInput,
    getMedicalRecordsOutput,
    getMedicalRecordByIdInput,
    medicalRecordSchema,
} = require('../schemas/medical-record.schema');

const viewProcedure = protectedProcedure.use(requirePermission('view:medical-record'));

const medicalRecordRouter = router({
    getMedicalRecords: viewProcedure
        .input(getMedicalRecordsInput)
        .output(getMedicalRecordsOutput)
        .query(async ({ input }) => {
            const { selectedText, page, limit, patientId, doctorId, isClientApp } = input;

            const filter = { isDeleted: false };
            if (selectedText) filter.medicalRecordId = { $regex: selectedText, $options: 'i' };
            if (isClientApp) filter.status = 'Completed';
            if (doctorId) filter.doctorId = doctorId;
            else if (patientId) filter.patientId = patientId;

            const [total, data] = await Promise.all([
                MedicalRecord.countDocuments(filter),
                MedicalRecord.find(filter)
                    .sort({ created_at: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .lean(),
            ]);

            return { data, total, page, totalPages: Math.ceil(total / limit) };
        }),

    getMedicalRecordById: viewProcedure
        .input(getMedicalRecordByIdInput)
        .output(medicalRecordSchema)
        .query(async ({ input }) => {
            const record = await MedicalRecord.findOne({
                medicalRecordId: input.medicalRecordId,
                isDeleted: false,
            }).lean();

            if (!record) throw ERR.medicalRecordNotFound();
            return record;
        }),
});

module.exports = { medicalRecordRouter };
