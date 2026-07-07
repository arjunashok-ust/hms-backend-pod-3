/**
 * @file errorMiddleware.js
 * @description
 * This file defines the global error handling middleware for the Express application.
 * It catches errors passed from controllers and other middlewares and formats them into a standardized JSON response.
 *
 * @overview
 * This middleware acts as a centralized error handler for the entire API.
 * It intercepts errors passed to `next()`.
 * It normalizes various error types, such as Mongoose validation errors (ValidationError), duplicate key errors (E11000), and JWT errors, into a consistent response format.
 * For unrecognized errors, it defaults to a generic 500 Internal Server Error.
 * It logs detailed error information to the console for debugging.
 * The level of detail in the final JSON response depends on the application's environment (development vs. production).
 *
 * Connections:
 *   ... -> asyncHandler -> (on error) -> ERRORMIDDLEWARE.JS -> API Response
 */
const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let code = err.code || "INTERNAL_SERVER_ERROR";
  let details = err.details || {};

  if (err.name === "ValidationError") {
    statusCode = 422;
    code = "VALIDATION_ERROR";
    details = Object.keys(err.errors).reduce((acc, key) => {
      acc[key] = err.errors[key].message;
      return acc;
    }, {});
  }

  if (err.code === 11000) {
    statusCode = 409;
    code = "CONFLICT_ERROR";
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
    details = { field, value: err.keyValue[field] };
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    code = "INVALID_TOKEN";
    message = "Invalid or malformed token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    code = "TOKEN_EXPIRED";
    message = "Token has expired";
  }

  console.error(`[${code}] ${message}`, {
    statusCode,
    details,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });

  res.status(statusCode).json({
    success: false,
    message,
    code,
    statusCode,
    ...(process.env.NODE_ENV === "development" && { details }),
  });
};

module.exports = errorMiddleware;
