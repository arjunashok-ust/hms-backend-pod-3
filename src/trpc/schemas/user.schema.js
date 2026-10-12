const { z } = require('zod');
const { VALIDATION_MESSAGES: V } = require('../../constants/messages.constants');
const { BLOOD_GROUPS, GENDERS } = require('../../constants/app.constants');
const { requiredString, emailSchema, dateSchema, paginationInput, paginated, messageOutput } = require('./common.schema');
const { employeeSchema, patientSchema, employeeProfileSchema } = require('./entities.schema');

// Inputs

const emailInput = z.object({ email: emailSchema });

const getPatientsInput = paginationInput;

const patientIdInput = z.object({ patientId: requiredString(V.PATIENT_ID_REQUIRED) });

const doctorIdInput = z.object({ doctorId: requiredString(V.DOCTOR_ID_REQUIRED) });

const getAvailableTimeSlotsInput = z.object({
    employeeId: requiredString(V.EMPLOYEE_ID_REQUIRED),
    date: dateSchema(V.APPOINTMENT_DATE_REQUIRED),
});

const updatePatientProfileInput = z.object({
    patientId: requiredString(V.PATIENT_ID_REQUIRED),
    name: requiredString(V.NAME_REQUIRED).optional(),
    gender: z.enum(GENDERS, { error: V.GENDER_INVALID }).optional(),
    dob: dateSchema(V.DOB_REQUIRED).optional(),
    address: requiredString(V.ADDRESS_REQUIRED).optional(),
    bloodGroup: z.enum(BLOOD_GROUPS, { error: V.BLOOD_GROUP_INVALID }).optional(),
    allergies: z.string().trim().optional(),
    emergencyContact: z.string().trim().optional(),
});

const searchInput = z.object({ searchText: requiredString(V.SEARCH_TEXT_REQUIRED) });

// Outputs

const patientProfileOutput = z.object({
    email: z.string(),
    status: z.string(),
    role: z.string(),
    isVerified: z.boolean().nullish(),
    uhid: z.string(),
    name: z.string(),
    gender: z.string().nullish(),
    dob: z.coerce.date().nullish(),
    allergies: z.string().nullish(),
    bloodGroup: z.string().nullish(),
    address: z.string().nullish(),
    phone: z.string().nullish(),
    emergencyContact: z.string().nullish(),
});

const patientIdOutput = z.object({ patientId: z.string() });

const availableSlotsOutput = z.object({ slots: z.array(z.string()) });

module.exports = {
    emailInput,
    getPatientsInput,
    patientIdInput,
    doctorIdInput,
    getAvailableTimeSlotsInput,
    updatePatientProfileInput,
    searchInput,
    patientListOutput: paginated(patientSchema),
    patientProfileOutput,
    patientIdOutput,
    availableSlotsOutput,
    patientsOutput: z.array(patientSchema),
    doctorsOutput: z.array(employeeSchema),
    patientOutput: patientSchema,
    doctorOutput: employeeSchema,
    employeeProfileOutput: employeeProfileSchema,
    messageOutput,
};
