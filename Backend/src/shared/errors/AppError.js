/**
 * Base application error class.
 * All operational errors should extend this class.
 * Non-operational errors (programmer bugs) will be caught by the global handler
 * and treated as 500 Internal Server Error without leaking details.
 */
export class AppError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human-readable error message
   * @param {string} [code] - Machine-readable error code (e.g. 'VALIDATION_ERROR')
   * @param {boolean} [isOperational=true] - Whether this is a known operational error
   */
  constructor(statusCode, message, code = 'APP_ERROR', isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  /**
   * @param {string} [message='Validation failed']
   * @param {Array} [errors=[]] - Array of field-level errors
   */
  constructor(message = 'Validation failed', errors = []) {
    super(422, message, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class UnauthorizedError extends AppError {
  /** @param {string} [message='Unauthorized'] */
  constructor(message = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  /** @param {string} [message='Forbidden'] */
  constructor(message = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  /** @param {string} [message='Resource not found'] */
  constructor(message = 'Resource not found') {
    super(404, message, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  /** @param {string} [message='Resource already exists'] */
  constructor(message = 'Resource already exists') {
    super(409, message, 'CONFLICT');
  }
}
