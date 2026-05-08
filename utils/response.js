// ─── Standardized API Response Helpers ────────────────────────────────────

/**
 * Send a successful JSON response.
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {*} data - Response payload
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error JSON response.
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {*} stack - Stack trace (only in development)
 */
const sendError = (res, message, statusCode = 500, stack = undefined) => {
  const response = {
    success: false,
    message,
  };

  if (stack) {
    response.stack = stack;
  }

  return res.status(statusCode).json(response);
};

module.exports = { sendSuccess, sendError };
