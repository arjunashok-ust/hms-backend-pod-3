/**
 * @file errorFactory.js
 * @description
 * This file defines a factory of custom error classes for centralized error handling.
 *
 * @overview
 * This module provides a set of specific error classes that extend the base `AppError`.
 * It includes classes like `ValidationError`, `AuthenticationError`, and `NotFoundError`.
 * Using these specific classes makes the code more readable and allows the error middleware to handle different error types with more specific logic if needed.
 *
 * Connections:
 *   ERRORFACTORY.JS -> appError.utils.js
 *
 * @note This factory provides an alternative to the `errors.utils.js` builder object.
 */

class AppError extends Error {
  constructor(message, statusCode, code, details = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = "Validation failed", details = {}) {
    super(message, 422, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

class AuthenticationError extends AppError {
  constructor(message = "Authentication failed", details = {}) {
    super(message, 401, "AUTHENTICATION_ERROR", details);
    this.name = "AuthenticationError";
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Access denied", details = {}) {
    super(message, 403, "FORBIDDEN_ERROR", details);
    this.name = "ForbiddenError";
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found", details = {}) {
    super(message, 404, "NOT_FOUND_ERROR", details);
    this.name = "NotFoundError";
  }
}

class ConflictError extends AppError {
  constructor(message = "Resource conflict", details = {}) {
    super(message, 409, "CONFLICT_ERROR", details);
    this.name = "ConflictError";
  }
}

class InternalServerError extends AppError {
  constructor(message = "Internal server error", details = {}) {
    super(message, 500, "INTERNAL_SERVER_ERROR", details);
    this.name = "InternalServerError";
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
};
