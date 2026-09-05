import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const ROLE_LEVEL = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
  super_admin: 5,
};

/**
 * JWT verification middleware
 * Extracts and validates the JWT from Authorization header
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is required. Provide a Bearer token in the Authorization header.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded; // { userId, orgId, role, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please sign in again.',
      });
    }
    return res.status(401).json({
      error: 'Invalid token',
      message: 'The provided authentication token is invalid.',
    });
  }
}

/**
 * Role-based authorization middleware
 * Checks if the authenticated user has the minimum required role level
 */
export function authorize(minRole) {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole || ROLE_LEVEL[userRole] === undefined) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Unable to determine your role.',
      });
    }

    if (ROLE_LEVEL[userRole] < ROLE_LEVEL[minRole]) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires ${minRole} role or higher.`,
        requiredRole: minRole,
        currentRole: userRole,
      });
    }

    next();
  };
}
