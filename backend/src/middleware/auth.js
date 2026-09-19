const jwt = require('jsonwebtoken');
const config = require('../config');
const { writeAuditLog } = require('../services/auditService');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.',
      code: 'UNAUTHORIZED',
    });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      fullName: payload.fullName,
    };
    return next();
  } catch (err) {
    const code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
    return res.status(401).json({
      success: false,
      message:
        code === 'TOKEN_EXPIRED'
          ? 'Session expired. Please log in again to continue data entry.'
          : 'Invalid authentication token.',
      code,
    });
  }
}

function authorize(...allowedRoles) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'UNAUTHORIZED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      await writeAuditLog({
        userId: req.user.id,
        action: 'ACCESS_DENIED',
        entityType: 'route',
        details: `Role ${req.user.role} blocked from ${req.method} ${req.originalUrl}`,
        ipAddress: req.ip,
      });
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
        code: 'FORBIDDEN',
      });
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
