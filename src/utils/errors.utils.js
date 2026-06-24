/**
 * Centralized error builders for common application errors.
 */
const AppError = require("./appError.utils");

const ERR = {
  // Authentication / identity
  invalidCredentials: () =>
    new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS"),
  tokenInvalidOrExpired: () =>
    new AppError("Invalid or expired token", 401, "INVALID_TOKEN"),
  tokenNotFound: () => new AppError("Token not found", 401, "TOKEN_NOT_FOUND"),

  // User / employee / patient lookup
  userNotFound: () => new AppError("User not found", 404, "USER_NOT_FOUND"),
  employeeNotFound: () =>
    new AppError("Employee not found", 404, "EMPLOYEE_NOT_FOUND"),
  patientNotFound: () =>
    new AppError("Patient not found", 404, "PATIENT_NOT_FOUND"),
  doctorNotFound: () =>
    new AppError("Doctor not found", 404, "DOCTOR_NOT_FOUND"),
  appointmentNotFound: () =>
    new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND"),

  // Appointment business rules
  existingPatientAppointment: () =>
    new AppError(
      "Patient already has an active appointment for this slot",
      409,
      "EXISTING_PATIENT_APPOINTMENT",
    ),
  existingSlot: () =>
    new AppError("Time slot already booked", 409, "EXISTING_SLOT"),
  appointmentPastTime: () =>
    new AppError(
      "You cannot book an appointment in the past",
      400,
      "APPOINTMENT_PAST_TIME",
    ),
  doctorNoSlot: () =>
    new AppError("No slots found for doctor", 404, "DOCTOR_NO_SLOT"),

  // Validation / business details
  missingAppointmentFields: () =>
    new AppError(
      "Missing required appointment fields",
      422,
      "MISSING_APPOINTMENT_FIELDS",
    ),
  invalidDoctorAndDate: () =>
    new AppError(
      "Doctor ID and date are required",
      422,
      "INVALID_DOCTOR_OR_DATE",
    ),

  // Common helpers
  invalidRequest: (message = "Invalid request", code = "INVALID_REQUEST") =>
    new AppError(message, 400, code),
  notFound: (message = "Resource not found", code = "NOT_FOUND") =>
    new AppError(message, 404, code),
  forbidden: (message = "Forbidden", code = "FORBIDDEN") =>
    new AppError(message, 403, code),
  conflict: (message = "Conflict", code = "CONFLICT") =>
    new AppError(message, 409, code),
  invalidVerificationToken: () =>
    new AppError(
      "Token is invalid or has expired.",
      400,
      "INVALID_VERIFICATION_TOKEN",
    ),

  // Generic
  internalError: () =>
    new AppError("Internal server error", 500, "INTERNAL_SERVER_ERROR"),
};

module.exports = ERR;
