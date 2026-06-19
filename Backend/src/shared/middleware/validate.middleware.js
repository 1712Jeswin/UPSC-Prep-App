import { ValidationError } from '../errors/AppError.js';

/**
 * Generic Zod validation middleware factory.
 *
 * Accepts a schema object with optional `body`, `params`, and `query` Zod schemas.
 * On validation failure, throws a ValidationError with structured field-level errors
 * which is then caught by the global error handler.
 *
 * @param {{ body?: import('zod').ZodSchema, params?: import('zod').ZodSchema, query?: import('zod').ZodSchema }} schema
 * @returns {import('express').RequestHandler}
 *
 * @example
 * router.post('/register',
 *   validate({ body: registerSchema }),
 *   asyncHandler(authController.register)
 * );
 */
export const validate = (schema) => (req, _res, next) => {
  const errors = [];

  if (schema.params) {
    const result = schema.params.safeParse(req.params);
    if (!result.success) {
      errors.push(...formatZodErrors(result.error, 'params'));
    } else {
      req.params = result.data;
    }
  }

  if (schema.query) {
    const result = schema.query.safeParse(req.query);
    if (!result.success) {
      errors.push(...formatZodErrors(result.error, 'query'));
    } else {
      req.query = result.data;
    }
  }

  if (schema.body) {
    const result = schema.body.safeParse(req.body);
    if (!result.success) {
      errors.push(...formatZodErrors(result.error, 'body'));
    } else {
      req.body = result.data;
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  next();
};

/**
 * Formats Zod errors into a structured array.
 * @param {import('zod').ZodError} zodError
 * @param {string} source - Where the error originated (body, params, query)
 * @returns {Array<{ field: string, message: string, source: string }>}
 */
function formatZodErrors(zodError, source) {
  return zodError.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    source,
  }));
}
