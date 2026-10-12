const { z } = require('zod');

const medicationSchema = z.object({
    name: z.string().optional(),
    dosage: z.string().optional(),
    frequency: z.string().optional(),
    duration: z.string().optional(),
});

const medicalObservationSchema = z.object({
    metricName: z.string().optional(),
    metricValue: z.string().optional(),
    recordedTime: z.coerce.date().optional(),
});

const statusSchema = z.enum(['Draft', 'Completed']);

// Output shape of a MedicalRecord document (src/models/medical-record.model.js)
const medicalRecordSchema = z.object({
    medicalRecordId: z.string(),
    doctorId: z.string(),
    appointmentId: z.string(),
    patientId: z.string(),
    complaint: z.string().optional(),
    symptoms: z.string().optional(),
    diagnosis: z.string().optional(),
    medications: z.array(medicationSchema).default([]),
    medicalObservations: z.array(medicalObservationSchema).default([]),
    notes: z.string().optional(),
    createdBy: z.string(),
    updatedBy: z.string().optional(),
    updatedAt: z.coerce.date().optional(),
    status: statusSchema.optional(),
    created_at: z.coerce.date().optional(),
});

// Inputs
const getMedicalRecordsInput = z.object({
    selectedText: z.string().trim().optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).default(5),
    patientId: z.string().optional(),
    doctorId: z.string().optional(),
    isClientApp: z.boolean().optional(),
});

const getMedicalRecordByIdInput = z.object({
    medicalRecordId: z.string().min(1),
});

const getMedicalRecordsOutput = z.object({
    data: z.array(medicalRecordSchema),
    total: z.number(),
    page: z.number(),
    totalPages: z.number(),
});

module.exports = {
    medicalRecordSchema,
    getMedicalRecordsInput,
    getMedicalRecordsOutput,
    getMedicalRecordByIdInput,
};
