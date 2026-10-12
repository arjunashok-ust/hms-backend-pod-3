const AppError = require('./appError.utils');
const { ERROR_MESSAGES: MSG } = require('../constants/messages.constants');

const ERR = {
    emailExists: () => new AppError(MSG.EMAIL_EXISTS, 409),
    phoneExists: () => new AppError(MSG.PHONE_EXISTS, 409),
    uniqueMedRegNo: () => new AppError(MSG.UNIQUE_MED_REG_NO, 409),
    medicalRecordExists: () => new AppError(MSG.MEDICAL_RECORD_EXISTS, 409),
    nodeExists: () => new AppError(MSG.NODE_EXISTS, 409),
    duplicateEntry: () => new AppError(MSG.DUPLICATE_ENTRY, 409),

    userNotFound: () => new AppError(MSG.USER_NOT_FOUND, 404),
    employeeNotFound: () => new AppError(MSG.EMPLOYEE_NOT_FOUND, 404),
    noUsersFound: () => new AppError(MSG.NO_USERS_FOUND, 404),
    patientNotFound: () => new AppError(MSG.PATIENT_NOT_FOUND, 404),
    doctorNotFound: () => new AppError(MSG.DOCTOR_NOT_FOUND, 404),
    roleNotFound: () => new AppError(MSG.ROLE_NOT_FOUND, 404),
    appointmentNotFound: () => new AppError(MSG.APPOINTMENT_NOT_FOUND, 404),
    medicalRecordNotFound: () => new AppError(MSG.MEDICAL_RECORD_NOT_FOUND, 404),
    tokenNotFound: () => new AppError(MSG.TOKEN_NOT_FOUND, 403),
    nodeNotFound: () => new AppError(MSG.NODE_NOT_FOUND, 404),

    existingPatientAppointment: () => new AppError(MSG.EXISTING_PATIENT_APPOINTMENT, 400),
    existingSlot: () => new AppError(MSG.EXISTING_SLOT, 409),

    invalidCredentials: () => new AppError(MSG.INVALID_CREDENTIALS, 401),
    tokenInvalidOrExpired: () => new AppError(MSG.TOKEN_INVALID_OR_EXPIRED, 403),

    // 401 variants, used by the tRPC layer so clients know when to refresh the token
    unauthenticated: () => new AppError(MSG.AUTH_REQUIRED, 401),
    sessionExpired: () => new AppError(MSG.TOKEN_INVALID_OR_EXPIRED, 401),
    refreshTokenMissing: () => new AppError(MSG.TOKEN_NOT_FOUND, 401),

    emailNotVerified: () => new AppError(MSG.EMAIL_NOT_VERIFIED, 400),
    accountNotActivated: () => new AppError(MSG.ACCOUNT_NOT_ACTIVATED, 400),
    verificationTokenInvalid: () => new AppError(MSG.VERIFICATION_TOKEN_INVALID, 400),

    alreadyActivated: () => new AppError(MSG.ALREADY_ACTIVATED, 400),
    alreadyNotActivated: () => new AppError(MSG.ALREADY_NOT_ACTIVATED, 400),

    medRoleRequired: () => new AppError(MSG.MED_ROLE_REQUIRED, 422),
    qualificationRequired: () => new AppError(MSG.QUALIFICATION_REQUIRED, 422),

    clientMobileApp: () => new AppError(MSG.CLIENT_MOBILE_APP, 403),
    setPassword: () => new AppError(MSG.SET_PASSWORD, 400),

    unknownRole: () => new AppError(MSG.UNKNOWN_ROLE, 400),
    nodeCreateFailed: () => new AppError(MSG.NODE_CREATE_FAILED, 400),

    appointmentPastTime: () => new AppError(MSG.APPOINTMENT_PAST_TIME, 400),
    doctorNoSlot: () => new AppError(MSG.DOCTOR_NO_SLOT, 404),

    accessDenied: () => new AppError(MSG.ACCESS_DENIED, 403),

    // business-rule violation; the message comes from VALIDATION_MESSAGES
    invalidInput: (message) => new AppError(message, 422),
}

module.exports = ERR;
