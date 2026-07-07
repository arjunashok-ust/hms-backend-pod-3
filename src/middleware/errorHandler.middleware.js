const errorHandler = (error, req, res) => {
    const message = error.message || "Internal server error";
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ status: error.status || "error", message: message })
}

module.exports = errorHandler;