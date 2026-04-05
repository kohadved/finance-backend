const { validationResult } = require('express-validator');

/**
 * Runs express-validator checks and short-circuits with 422 if any fail.
 * Attach this AFTER the validation rule chains in a route definition.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = validate;
