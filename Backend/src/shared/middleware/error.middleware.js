import { AppError, ValidationError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

/**
 * Global error handling middleware.
 * Must be registered LAST in the Express middleware chain.
 *
 * Handles:
 * - AppError subclasses → structured error with correct status code
 * - ZodError → 422 with formatted field errors (fallback if validate middleware is bypassed)
 * - Unknown errors → 500, logs full stack, never leaks details in production
 */
// eslint-disable-next-line no-unused-vars
export const globalErrorHandler = (err, req, res, _next) => {
  // Already sent headers — delegate to Express default handler
  if (res.headersSent) {
    return;
  }

  // Handle known operational errors (AppError hierarchy)
  if (err instanceof AppError) {
    const response = {
      success: false,
      message: err.message,
      errors: err instanceof ValidationError ? err.errors : [],
    };

    if (err.isOperational) {
      logger.warn({ err: { code: err.code, statusCode: err.statusCode }, path: req.path }, err.message);
    } else {
      logger.error({ err, path: req.path }, 'Non-operational AppError');
    }

    return res.status(err.statusCode).json(response);
  }

  // Handle raw Zod errors (if validate middleware was bypassed)
  if (err.name === 'ZodError') {
    const errors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    logger.warn({ path: req.path, errors }, 'Zod validation error');

    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Unknown / programmer error — log full stack, never leak details
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');

  const isProduction = process.env.NODE_ENV === 'production';

  return res.status(500).json({
    success: false,
    message: isProduction ? 'Internal Server Error' : err.message,
    errors: [],
  });
};
