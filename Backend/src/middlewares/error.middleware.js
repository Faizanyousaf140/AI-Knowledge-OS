const logger = require("../utils/logger");

module.exports = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  const statusCode = Number(err.statusCode) || 500;
  const isClientError = statusCode >= 400 && statusCode < 500;
  const message = isClientError ? (err.message || "Request failed") : "An unexpected error occurred";

  res.status(err.statusCode || 500).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
};