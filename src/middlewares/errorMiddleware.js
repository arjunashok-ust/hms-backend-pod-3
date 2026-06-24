/**
 * Global error handling middleware
 * Must be registered as the last middleware in app.js
 * Catches all errors from routes and async handlers
 */

const errorMiddleware = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let code = err.code || "INTERNAL_SERVER_ERROR";
  let details = err.details || {};

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    statusCode = 422;
    code = "VALIDATION_ERROR";
    details = Object.keys(err.errors).reduce((acc, key) => {
      acc[key] = err.errors[key].message;
      return acc;
    }, {});
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    statusCode = 409;
    code = "CONFLICT_ERROR";
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
    details = { field, value: err.keyValue[field] };
  }

  // Handle JWT errors
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

  // Log error with context
  console.error(`[${code}] ${message}`, {
    statusCode,
    details,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });

  // Send response to client
  res.status(statusCode).json({
    success: false,
    message,
    code,
    statusCode,
    ...(process.env.NODE_ENV === "development" && { details }),
  });
};

module.exports = errorMiddleware;
