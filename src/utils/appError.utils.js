/**
 * @file appError.utils.js
 * @description
 * This file defines the generic AppError class used for standardized error handling.
 *
 * @overview
 * This class serves as the base for all operational errors within the application.
 * It extends the native Error class to include a status code, a unique error code, and optional details.
 * The `isOperational` flag distinguishes these predictable errors from unexpected system errors.
 * This structure is consumed by the global error middleware to generate consistent API error responses.
 *
 * Connections:
 *   errors.utils.js -> APPERROR.UTILS.JS
 *   errorFactory.js -> APPERROR.UTILS.JS
 */

class AppError extends Error {
  constructor(
    message,
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    details = {},
  ) {
    super(message);
    this.message = message;
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
