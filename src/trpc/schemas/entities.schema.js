const { z } = require('zod');
const { objectIdSchema } = require('./common.schema');

// Output shapes. zod strips unknown keys, so these double as the allow-list of fields
// that may leave the server (no password hashes, tokens, soft-delete bookkeeping...).
// Everything except identifiers is nullish so legacy documents never break a response.

const employeeSchema = z.object({
    employeeCode: z.string(),
    name: z.string(),
    email: z.string(),
    department: z.string().nullish(),
    designation: z.string().nullish(),
    joiningDate: z.coerce.date().nullish(),
    medicalRegistrationNo: z.string().nullish(),
    specialization: z.string().nullish(),
    qualification: z.string().nullish(),
    consultationFee: z.number().nullish(),
    availabilitySlots: z.array(z.string()).nullish().transform((v) => v ?? []),
});

const patientSchema = z.object({
    uhid: z.string(),
    name: z.string(),
    phone: z.string().nullish(),
    email: z.string(),
    gender: z.string().nullish(),
    dob: z.coerce.date().nullish(),
    bloodGroup: z.string().nullish(),
    allergies: z.string().nullish(),
    address: z.string().nullish(),
    emergencyContact: z.string().nullish(),
});

const appointmentSchema = z.object({
    appointmentId: z.string(),
    patientId: z.string(),
    doctorEmployeeId: z.string(),
    date: z.coerce.date(),
    timeSlot: z.string(),
    status: z.string(),
    createdByEmployeeId: z.string().nullish(),
});

// account (users collection) without credentials / tokens
const userAccountSchema = z.object({
    email: z.string(),
    status: z.string(),
    role: z.string(),
    employeeId: z.string().nullish(),
    patientId: z.string().nullish(),
    isVerified: z.boolean().nullish(),
    firstLogin: z.boolean().nullish(),
    lastLoginAt: z.coerce.date().nullish(),
});

// employee + account merged, the shape the admin screens consume
const employeeProfileSchema = z.object({
    name: z.string().nullable(),
    email: z.string(),
    status: z.string(),
    role: z.string(),
    employeeId: z.string().nullish(),
    isVerified: z.boolean().nullish(),
    firstLogin: z.boolean().nullish(),
    department: z.string().nullable(),
    designation: z.string().nullable(),
    joiningDate: z.coerce.date().nullable(),
    medicalRegistrationNo: z.string().nullable(),
    specialization: z.string().nullable(),
    qualification: z.string().nullable(),
    consultationFee: z.number().nullable(),
    availabilitySlots: z.array(z.string()),
});

const roleSchema = z.object({
    _id: objectIdSchema,
    role_id: z.number().nullish(),
    role_name: z.string(),
    role_permissions: z.array(z.string()).nullish().transform((v) => v ?? []),
});

const nodeSchema = z.object({
    _id: objectIdSchema,
    order: z.number(),
    name: z.string(),
    path: z.string(),
    role: z.array(z.string()),
    icon: z.string(),
});

module.exports = {
    employeeSchema,
    patientSchema,
    appointmentSchema,
    userAccountSchema,
    employeeProfileSchema,
    roleSchema,
    nodeSchema,
};
