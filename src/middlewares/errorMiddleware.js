

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
