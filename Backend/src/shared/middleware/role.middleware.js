import { UnauthorizedError, ForbiddenError } from '../errors/AppError.js';

/**
 * Middleware to restrict route access based on user role.
 * Must be attached after verifyToken middleware.
 *
 * @param {...string} allowedRoles - Roles allowed to access the route
 * @returns {import('express').RequestHandler}
 *
 * @example
 * router.use(verifyToken, checkRole('admin'));
 */
export const checkRole = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Unauthorized - Missing user context');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('Forbidden - Insufficient administrative privileges');
    }

    next();
  };
};
