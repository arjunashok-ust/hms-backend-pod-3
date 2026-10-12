const { z } = require('zod');
const { VALIDATION_MESSAGES: V } = require('../../constants/messages.constants');
const { APPOINTMENT_STATUS } = require('../../constants/app.constants');
const { requiredString, dateSchema, paginationInput, paginated, messageOutput } = require('./common.schema');
const { appointmentSchema, employeeSchema } = require('./entities.schema');

const statusSchema = z.enum(Object.values(APPOINTMENT_STATUS), { error: V.STATUS_INVALID });

// Inputs
// createdBy / deletedBy are taken from the access token, never from the client.

const createAppointmentInput = z.object({
    patientId: requiredString(V.PATIENT_ID_REQUIRED),
    doctorEmployeeId: requiredString(V.DOCTOR_ID_REQUIRED),
    date: dateSchema(V.APPOINTMENT_DATE_REQUIRED),
    timeSlot: requiredString(V.TIME_SLOT_REQUIRED),
    status: statusSchema.default(APPOINTMENT_STATUS.BOOKED),
});

const getAllAppointmentsInput = paginationInput;

const getAppointmentsByPatientIdInput = paginationInput.extend({
    patientId: requiredString(V.PATIENT_ID_REQUIRED),
});

const appointmentIdInput = z.object({ appointmentId: requiredString(V.APPOINTMENT_ID_REQUIRED) });

const employeeIdInput = z.object({ employeeId: requiredString(V.EMPLOYEE_ID_REQUIRED) });

const editAppointmentInput = z.object({
    appointmentId: requiredString(V.APPOINTMENT_ID_REQUIRED),
    patientId: requiredString(V.PATIENT_ID_REQUIRED),
    doctorEmployeeId: requiredString(V.DOCTOR_ID_REQUIRED),
    date: dateSchema(V.APPOINTMENT_DATE_REQUIRED),
    timeSlot: requiredString(V.TIME_SLOT_REQUIRED),
    status: statusSchema.optional(),
});

const editAppointmentStatusInput = z.object({
    appointmentId: requiredString(V.APPOINTMENT_ID_REQUIRED),
    status: statusSchema,
});

const getAppointmentByDoctorIdOrPatientIdInput = z.object({
    doctorId: z.string().trim().optional(),
    patientId: z.string().trim().optional(),
    appointmentId: z.string().trim().optional(),
});

// Outputs

const createAppointmentOutput = z.object({
    message: z.string(),
    appointmentId: z.string(),
    date: z.coerce.date(),
    status: z.string(),
});

const appointmentStatsOutput = z.object({
    appointmentCount: z.number(),
    bookedCount: z.number(),
    cancelledCount: z.number(),
    completedCount: z.number(),
});

module.exports = {
    createAppointmentInput,
    getAllAppointmentsInput,
    getAppointmentsByPatientIdInput,
    appointmentIdInput,
    employeeIdInput,
    editAppointmentInput,
    editAppointmentStatusInput,
    getAppointmentByDoctorIdOrPatientIdInput,
    createAppointmentOutput,
    appointmentStatsOutput,
    appointmentListOutput: paginated(appointmentSchema),
    appointmentsOutput: z.array(appointmentSchema),
    doctorsOutput: z.array(employeeSchema),
    doctorOutput: employeeSchema,
    messageOutput,
};
