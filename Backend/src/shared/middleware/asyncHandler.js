/**
 * Wraps async route handlers to automatically catch rejected promises
 * and forward them to Express's error handling middleware.
 *
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 *
 * @param {Function} fn - Async Express route handler
 * @returns {Function} Express middleware
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
