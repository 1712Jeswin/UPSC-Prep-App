/**
 * Standardized API response helpers.
 * Enforces the frozen frontend contract shape.
 *
 * Success: { success: true, message, data, [meta] }
 * Error:   { success: false, message, errors }
 */

/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {string} message - Human-readable description
 * @param {object} [data={}] - Response payload
 * @param {number} [statusCode=200] - HTTP status code
 * @param {object} [meta] - Optional pagination/meta info
 */
export const sendSuccess = (res, message, data = {}, statusCode = 200, meta) => {
  const response = { success: true, message, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string} message - Human-readable error description
 * @param {Array} [errors=[]] - Array of field-level or validation errors
 * @param {number} [statusCode=400] - HTTP status code
 */
export const sendError = (res, message, errors = [], statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
