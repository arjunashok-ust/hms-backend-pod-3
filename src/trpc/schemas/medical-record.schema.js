const { z } = require('zod');
const { VALIDATION_MESSAGES: V } = require('../../constants/messages.constants');
const { MEDICAL_RECORD_STATUS } = require('../../constants/app.constants');
const { requiredString, paginationInput, paginated, messageOutput } = require('./common.schema');

const medicationSchema = z.object({
    name: z.string().nullish(),
    dosage: z.string().nullish(),
    frequency: z.string().nullish(),
    duration: z.string().nullish(),
});

const medicalObservationSchema = z.object({
    metricName: z.string().nullish(),
    metricValue: z.string().nullish(),
    recordedTime: z.coerce.date().nullish(),
});

const statusSchema = z.enum(Object.values(MEDICAL_RECORD_STATUS), { error: V.STATUS_INVALID });

// Output shape of a MedicalRecord document (src/models/medical-record.model.js)
const medicalRecordSchema = z.object({
    medicalRecordId: z.string(),
    doctorId: z.string(),
    appointmentId: z.string(),
    patientId: z.string(),
    complaint: z.string().nullish(),
    symptoms: z.string().nullish(),
    diagnosis: z.string().nullish(),
    medications: z.array(medicationSchema).nullish().transform((v) => v ?? []),
    medicalObservations: z.array(medicalObservationSchema).nullish().transform((v) => v ?? []),
    notes: z.string().nullish(),
    createdBy: z.string(),
    updatedBy: z.string().nullish(),
    updatedAt: z.coerce.date().nullish(),
    status: statusSchema.nullish(),
    created_at: z.coerce.date().nullish(),
});

// Inputs

const medicationInput = z.object({
    name: z.string().trim().optional(),
    dosage: z.string().trim().optional(),
    frequency: z.string().trim().optional(),
    duration: z.string().trim().optional(),
});

const medicalObservationInput = z.object({
    metricName: z.string().trim().optional(),
    metricValue: z.string().trim().optional(),
    recordedTime: z.coerce.date({ error: V.DATE_INVALID }).optional(),
});

// createdBy / updatedBy / updatedAt are set by the server from the access token.
const medicalRecordFields = {
    doctorId: requiredString(V.DOCTOR_ID_FIELD_REQUIRED),
    appointmentId: requiredString(V.APPOINTMENT_ID_FIELD_REQUIRED),
    patientId: requiredString(V.PATIENT_ID_FIELD_REQUIRED),
    complaint: z.string().trim().optional(),
    symptoms: z.string().trim().optional(),
    diagnosis: z.string().trim().optional(),
    medications: z.array(medicationInput).optional(),
    medicalObservations: z.array(medicalObservationInput).optional(),
    notes: z.string().trim().optional(),
    status: statusSchema.optional(),
};

// a record may only be saved as a draft while the clinical fields are incomplete
const requireClinicalFieldsUnlessDraft = (value, ctx) => {
    if (value.status === MEDICAL_RECORD_STATUS.DRAFT) return;
    [
        ['complaint', V.COMPLAINT_REQUIRED],
        ['symptoms', V.SYMPTOMS_REQUIRED],
        ['diagnosis', V.DIAGNOSIS_REQUIRED],
    ].forEach(([field, message]) => {
        if (!value[field]) ctx.addIssue({ code: 'custom', path: [field], message });
    });
};

const createMedicalRecordInput = z.object(medicalRecordFields).superRefine(requireClinicalFieldsUnlessDraft);

const updateMedicalRecordInput = z
    .object({
        medicalRecordId: requiredString(V.MEDICAL_RECORD_ID_REQUIRED),
        ...medicalRecordFields,
    })
    .superRefine(requireClinicalFieldsUnlessDraft);

const getMedicalRecordsInput = paginationInput.extend({
    patientId: z.string().optional(),
    doctorId: z.string().optional(),
    isClientApp: z.boolean().optional(),
});

const getMedicalRecordByIdInput = z.object({
    medicalRecordId: requiredString(V.MEDICAL_RECORD_ID_REQUIRED),
});

const deleteMedicalRecordInput = getMedicalRecordByIdInput;

// Outputs

const getMedicalRecordsOutput = paginated(medicalRecordSchema);

const createMedicalRecordOutput = z.object({ message: z.string(), medicalRecordId: z.string() });

const medicalRecordStatsOutput = z.object({
    medicalRecordCount: z.number(),
    completedCount: z.number(),
    draftCount: z.number(),
    deletedCount: z.number(),
});

module.exports = {
    medicalRecordSchema,
    createMedicalRecordInput,
    updateMedicalRecordInput,
    getMedicalRecordsInput,
    getMedicalRecordByIdInput,
    deleteMedicalRecordInput,
    getMedicalRecordsOutput,
    createMedicalRecordOutput,
    medicalRecordStatsOutput,
    messageOutput,
};
