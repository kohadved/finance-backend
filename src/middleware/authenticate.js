const jwt = require('jsonwebtoken');
const db  = require('../config/database');
const AppError = require('../utils/AppError');

/**
 * Verifies the Bearer JWT in the Authorization header.
 * On success, attaches the full user row to req.user.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return next(new AppError('Authentication required. Provide a Bearer token.', 401));
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return next(new AppError('Invalid or expired token.', 401));
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ? AND status = ?').get(payload.sub, 'active');
  if (!user) {
    return next(new AppError('User not found or account is inactive.', 401));
  }

  req.user = user;
  next();
}

module.exports = authenticate;
