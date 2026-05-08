const { sendError } = require('../utils/response');

// ─── Global Error Handler Middleware ──────────────────────────────────────
// Must have 4 parameters for Express to recognize it as error middleware
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // ── Mongoose: CastError (invalid ObjectId) ─────────────────────────────
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = `Resource not found. Invalid ID: ${err.value}`;
  }

  // ── Mongoose: Duplicate Key Error ──────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    message = `Duplicate value: '${value}' already exists for field '${field}'.`;
  }

  // ── Mongoose: Validation Error ─────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 422;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join(', ');
  }

  // ── JWT: Invalid Token ─────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }

  // ── JWT: Expired Token ─────────────────────────────────────────────────
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired.';
  }

  // Log error details in development
  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 Error:', {
      message: err.message,
      stack: err.stack,
    });
  }

  return sendError(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : undefined);
};

module.exports = errorHandler;
