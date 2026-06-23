const AppError = require('./appError.utils');

const ERR = {
    emailExists: () => new AppError("Email is already registered.", 409),
    phoneExists: () => new AppError("Phone number is already registered", 409),
    uniqueMedRegNo: () => new AppError("Medical registration no should be unique", 409),
    medicalRecordExists: () => new AppError("Medical record already exists", 409),

    userNotFound: () => new AppError("User not found", 404),
    employeeNotFound: () => new AppError("Employee not found", 404),
    noUsersFound: () => new AppError("No users found", 404),
    patientNotFound: () => new AppError("Patient not found", 404),
    doctorNotFound: () => new AppError("Doctor not found", 404),
    appointmentNotFound: () => new AppError("Appointment not found", 404),
    medicalRecordNotFound: () => new AppError("Medical Record not found", 404),
    tokenNotFound: () => new AppError("Token not found",403),
    
    existingPatientAppointment: () => new AppError("Patient have another appointment booked for this slot", 400),
    existingSlot: () => new AppError("Time slot already booked"),

    invalidCredentials: () => new AppError("Invalid credentials", 401),
    tokenInvalidOrExpired: () => new AppError("Invalid or expired token", 403),

    emailNotVerified: () => new AppError("Email not verified", 400),
    accountNotActivated: () => new AppError("Account not activated", 400),
    verificationTokenInvalid: () => new AppError("Verification token in invalid", 400),

    alreadyActivated: () => new AppError("Account is already activated", 400),
    alreadyNotActivated: () => new AppError("Account is already not active", 400),

    medRoleRequired: () => new AppError("This role requires medical registration number", 422),
    qualificationRequired: () => new AppError("This role requires qualification", 422),

    clientMobileApp: () => new AppError("Only patients are allowed to sign in using the mobile app", 403),
    setPassword: () => new AppError("Set password is only allowed for first time users", 400),

    unknownRole: () => new AppError("Unknown role", 400),

    appointmentPastTime: () => new AppError("You cant book appointment in the past", 400),
    doctorNoSlot: () => new AppError("No slots find for doctor", 404),
}

module.exports = ERR;