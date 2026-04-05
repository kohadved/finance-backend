const AppError = require('../utils/AppError');

// Role hierarchy: higher index = more permissions
const ROLE_RANK = { viewer: 0, analyst: 1, admin: 2 };

/**
 * Factory that returns middleware accepting any of the specified roles.
 * Usage: authorize('admin')  or  authorize('analyst', 'admin')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}.`,
          403
        )
      );
    }

    next();
  };
}

/**
 * Convenience: allow users whose role rank is >= the given role.
 * e.g. authorizeMin('analyst') allows analyst and admin.
 */
function authorizeMin(minRole) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (ROLE_RANK[req.user.role] < ROLE_RANK[minRole]) {
      return next(
        new AppError(
          `Access denied. Minimum role required: ${minRole}. Your role: ${req.user.role}.`,
          403
        )
      );
    }

    next();
  };
}

module.exports = { authorize, authorizeMin };
