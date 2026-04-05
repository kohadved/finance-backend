const AppError = require('../utils/AppError');

// Global error-handling middleware (must have 4 params for Express to recognise it)
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // express-validator or JSON parse errors arrive as plain errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const statusCode = err.isOperational ? err.statusCode : 500;
  const message    = err.isOperational ? err.message : 'Internal server error';

  if (!err.isOperational) {
    // Log unexpected errors for debugging without leaking details to the client
    console.error('[Unhandled Error]', err);
  }

  res.status(statusCode).json({ error: message });
}

module.exports = errorHandler;
