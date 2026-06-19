import rateLimit from 'express-rate-limit';

/**
 * Creates a rate limiter with consistent error response shape.
 * @param {object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Max requests per window per IP
 * @param {string} options.message - Error message when rate limited
 */
const createLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        message,
        errors: [],
      });
    },
  });

/**
 * Auth routes: 5 requests per minute per IP.
 * Protects login/register from brute-force attacks.
 */
export const authLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts. Please try again after 1 minute.',
});

/**
 * Admin routes: 10 requests per minute per IP.
 * Prevents accidental mass operations.
 */
export const adminLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many admin requests. Please try again after 1 minute.',
});

/**
 * Public/general routes: 60 requests per minute per IP.
 * Standard API protection against abuse.
 */
export const publicLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many requests. Please try again after 1 minute.',
});
