import { sendError } from "../utils/apiResponse.js";

/**
 * Middleware to restrict route access based on user role.
 * Must be attached after verifyToken middleware.
 * 
 * @param {...string} allowedRoles Roles allowed to access the route
 */
export const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, "Unauthorized - Missing user context", [], 401);
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, "Forbidden - Insufficient administrative privileges", [], 403);
    }
    
    next();
  };
};
