const ApiError = require("../utils/ApiError");

/**
 * Centralized error handler.
 * Place this AFTER all routes in app.js: app.use(errorMiddleware)
 */
const errorMiddleware = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, "INTERNAL_ERROR", []);
  }

  console.error(`[ERROR] ${req.method} ${req.originalUrl} ->`, error.message);

  return res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errorCode: error.errorCode,
    errors: error.errors,
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  });
};

module.exports = errorMiddleware;