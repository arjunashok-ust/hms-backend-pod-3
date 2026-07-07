/**
 * @file errorResponse.js
 * @description
 * This file provides a utility function to format and send standardized error responses.
 *
 * @overview
 * The `sendError` function is a helper for manually constructing and sending a JSON error response.
 * It helps maintain a consistent error structure in parts of the application that might not use the `asyncHandler` and global error middleware pattern.
 *
 * Connections:
 *   (Controllers/Middlewares) -> ERRORRESPONSE.JS -> API Response
 *
 * @note This utility is generally for code that does not throw errors to be caught by `errorMiddleware`.
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
