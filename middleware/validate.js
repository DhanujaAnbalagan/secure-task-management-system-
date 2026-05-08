const { validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

// ─── Validate Request: Run after express-validator chains ─────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Format errors into a clean array of { field, message }
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }

  next();
};

module.exports = { validate };
