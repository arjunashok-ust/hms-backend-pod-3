const { z } = require('zod');
const { VALIDATION_MESSAGES: V } = require('../../constants/messages.constants');
const { DEPARTMENTS } = require('../../constants/app.constants');
const {
    requiredString,
    dateSchema,
    optionalNumber,
    paginationInput,
    paginated,
} = require('./common.schema');
const { employeeSchema, employeeProfileSchema, userAccountSchema, roleSchema } = require('./entities.schema');

// Inputs

const employeeIdInput = z.object({ employeeId: requiredString(V.EMPLOYEE_ID_REQUIRED) });

const getAllUsersInput = paginationInput.extend({
    selectedDepartment: z.enum(DEPARTMENTS, { error: V.DEPARTMENT_INVALID }).optional(),
});

// Role specific rules (doctor fee/slots, medical registration...) depend on the account's
// role, which is read from the database in the service, not trusted from the client.
// email and role are intentionally not editable here.
const updateUserProfileInput = z.object({
    employeeId: requiredString(V.EMPLOYEE_ID_REQUIRED),
    data: z.object({
        name: requiredString(V.NAME_REQUIRED).regex(/^[a-zA-Z\s]+$/, V.NAME_INVALID),
        department: z.enum(DEPARTMENTS, { error: V.DEPARTMENT_INVALID }),
        designation: requiredString(V.DESIGNATION_REQUIRED),
        joiningDate: dateSchema(V.JOINING_DATE_REQUIRED),
        medicalRegistrationNo: z.string().trim().optional(),
        specialization: z.string().trim().optional(),
        qualification: z.string().trim().optional(),
        consultationFee: optionalNumber(V.CONSULTATION_FEE_NUMERIC),
        availabilitySlots: z.array(z.string()).optional(),
    }),
});

const updateRoleInput = z.object({
    roleName: requiredString(V.ROLE_NAME_REQUIRED),
    data: z.object({
        role_permissions: z.array(z.string().regex(/^[a-z]+:[a-z-]+$/, V.PERMISSION_INVALID)),
    }),
});

// Outputs

const dashboardOutput = z.object({
    employeeCount: z.number(),
    activeCount: z.number(),
    inactiveCount: z.number(),
    verifiedCount: z.number(),
    pendingApprovalCount: z.number(),
    pendingVerifyCount: z.number(),
    pendingFirstLoginCount: z.number(),
    patientCount: z.number(),
    departmentCount: z.number(),
    appointmentCount: z.number(),
});

const employeeIdMessageOutput = z.object({ message: z.string(), employeeId: z.string() });

module.exports = {
    employeeIdInput,
    getAllUsersInput,
    getUserEmployeeInput: paginationInput,
    updateUserProfileInput,
    updateRoleInput,
    dashboardOutput,
    employeeIdMessageOutput,
    employeeListOutput: paginated(employeeSchema),
    employeeProfileListOutput: paginated(employeeProfileSchema),
    usersOutput: z.array(userAccountSchema),
    rolesOutput: z.array(roleSchema),
    roleOutput: roleSchema,
};
