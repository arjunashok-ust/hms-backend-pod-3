/**
 * Error response formatter for use in existing code
 * Helps maintain consistency when not using asyncHandler
 */

const sendError = (res, statusCode, message, code, details = {}) => {
  res.status(statusCode).json({
    success: false,
    message,
    code,
    statusCode,
    ...(process.env.NODE_ENV === "development" && { details }),
  });
};

module.exports = {
  sendError,
};
