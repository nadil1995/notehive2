const { verifyAccessToken } = require('../utils/jwt');

/**
 * Middleware to verify JWT access token
 * Expects token in Authorization header: "Bearer <token>"
 */
function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No authorization header provided'
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token verification failed'
    });
  }
}

/**
 * Middleware to verify user role
 * @param {string|Array<string>} requiredRoles - Role(s) required to access
 * @returns {Function} Express middleware
 */
function verifyRole(requiredRoles) {
  return (req, res, next) => {
    try {
      // Ensure token is verified first
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      next();
    } catch (error) {
      return res.status(403).json({
        success: false,
        error: 'Role verification failed'
      });
    }
  };
}

/**
 * Optional middleware to verify token if provided
 * Unlike verifyToken, this doesn't fail if no token is provided
 */
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];

    if (authHeader) {
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

      const decoded = verifyAccessToken(token);
      if (decoded) {
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    next();
  }
}

module.exports = {
  verifyToken,
  verifyRole,
  optionalAuth
};
