const { z } = require('zod');
const { VALIDATION_MESSAGES: V } = require('../../constants/messages.constants');
const { SIGNUP_ROLES } = require('../../constants/roles.constants');
const { USER_STATUS, DEPARTMENTS, BLOOD_GROUPS, GENDERS } = require('../../constants/app.constants');
const { employeeRoleIssues } = require('../../utils/employeeRules.utils');
const { requiredString, emailSchema, passwordSchema, newPasswordSchema, dateSchema, optionalNumber } = require('./common.schema');
const { roleSchema } = require('./entities.schema');

const statusSchema = z.enum(Object.values(USER_STATUS), { error: V.STATUS_INVALID });

// Inputs

const signUpInput = z
    .object({
        name: requiredString(V.NAME_REQUIRED).regex(/^[a-zA-Z\s]+$/, V.NAME_INVALID),
        email: emailSchema,
        // only required when an employee signs up themselves, admins get a generated one by mail
        password: z.string().optional(),
        department: z.enum(DEPARTMENTS, { error: V.DEPARTMENT_INVALID }),
        role: z.enum(SIGNUP_ROLES, { error: V.ROLE_INVALID }),
        designation: requiredString(V.DESIGNATION_REQUIRED),
        status: statusSchema.optional(),
        joiningDate: dateSchema(V.JOINING_DATE_REQUIRED),
        medicalRegistrationNo: z.string().trim().optional(),
        specialization: z.string().trim().optional(),
        qualification: z.string().trim().optional(),
        consultationFee: optionalNumber(V.CONSULTATION_FEE_NUMERIC),
        availabilitySlots: z.array(z.string()).optional(),
    })
    .superRefine((value, ctx) => {
        if (value.status !== USER_STATUS.ACTIVE) {
            const result = newPasswordSchema.safeParse(value.password);
            if (!result.success) {
                result.error.issues.forEach((issue) => ctx.addIssue({ code: 'custom', path: ['password'], message: issue.message }));
            }
        }
        employeeRoleIssues(value.role, value).forEach((issue) => ctx.addIssue({ code: 'custom', ...issue }));
    });

const patientSignUpInput = z
    .object({
        name: requiredString(V.NAME_REQUIRED),
        email: emailSchema,
        password: z.string().optional(),
        status: statusSchema.optional(),
        phone: requiredString(V.PHONE_REQUIRED),
        gender: z.enum(GENDERS, { error: V.GENDER_INVALID }),
        dob: dateSchema(V.DOB_REQUIRED),
        address: requiredString(V.ADDRESS_REQUIRED),
        bloodGroup: z.enum(BLOOD_GROUPS, { error: V.BLOOD_GROUP_INVALID }),
        allergies: z.string().trim().optional(),
        emergencyContact: z.string().trim().optional(),
    })
    .superRefine((value, ctx) => {
        // an active patient registers with their own password, otherwise one is generated and mailed
        if (value.status === USER_STATUS.ACTIVE) {
            const result = passwordSchema.safeParse(value.password);
            if (!result.success) {
                result.error.issues.forEach((issue) => ctx.addIssue({ code: 'custom', path: ['password'], message: issue.message }));
            }
        }
    });

const loginInput = z.object({
    email: emailSchema,
    password: passwordSchema,
    isClientApp: z.boolean().optional(),
});

const setPasswordInput = z.object({ password: passwordSchema });

const verifyEmailInput = z.object({
    email: emailSchema,
    verificationToken: requiredString(V.VERIFICATION_TOKEN_REQUIRED),
});

const getPermissionsInput = z.object({ role: requiredString(V.ROLE_REQUIRED) });

const resetPasswordInput = z.object({ email: emailSchema });

const verifyResetPasswordInput = z.object({
    email: emailSchema,
    resetToken: requiredString(V.RESET_TOKEN_REQUIRED),
});

// Outputs

const signUpOutput = z.object({ message: z.string(), email: z.string() });

const loginOutput = z.object({
    message: z.string(),
    email: z.string(),
    token: z.string(),
    role: z.string(),
    status: z.string(),
    firstLogin: z.boolean().nullish(),
});

const refreshTokenOutput = z.object({ token: z.string() });

module.exports = {
    signUpInput,
    patientSignUpInput,
    loginInput,
    setPasswordInput,
    verifyEmailInput,
    getPermissionsInput,
    resetPasswordInput,
    verifyResetPasswordInput,
    signUpOutput,
    loginOutput,
    refreshTokenOutput,
    permissionsOutput: roleSchema,
};
