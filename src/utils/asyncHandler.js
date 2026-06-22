/**
 * Wraps an async route/controller function and forwards any thrown error
 * to Express's error-handling middleware via next(err).
 *
 * Usage:
 *   exports.getEmployees = asyncHandler(async (req, res) => { ... });
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

module.exports = asyncHandler;