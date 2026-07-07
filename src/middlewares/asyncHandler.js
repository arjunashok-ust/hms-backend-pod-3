/**
 * @file asyncHandler.js
 * @description
 * This file provides a utility function to wrap asynchronous Express.js route handlers.
 * It ensures that any errors occurring within async functions are properly caught and passed to the next middleware.
 *
 * @overview
 * The `asyncHandler` is a higher-order function that takes an async route handler as input.
 * It returns a new function that executes the original handler and catches any promise rejections.
 * Any caught error is passed to the Express `next()` function for centralized error handling.
 * This avoids the need for repetitive try/catch blocks in every async controller function.
 *
 * Connections:
 *   ... -> ASYNCHANDLER.JS -> controller
 *   controller -> (on error) -> ASYNCHANDLER.JS -> errorMiddleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
