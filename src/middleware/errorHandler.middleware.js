const errorHandler = (error, req, res, next) => {
    const message = error.message || "Internal server error";
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ status: error.status || "error", message: error.message })
}

module.exports = errorHandler;