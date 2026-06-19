import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Main application logger.
 * - In production: JSON output for log aggregation
 * - In development: Pretty-printed for readability
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }),
});

/**
 * Creates a child logger scoped to a specific module.
 * @param {string} moduleName - The name of the module (e.g. 'auth', 'admin')
 * @returns {import('pino').Logger}
 */
export const createModuleLogger = (moduleName) => {
  return logger.child({ module: moduleName });
};

/**
 * Audit logger for security-critical and admin actions.
 * Always logs at 'info' level regardless of global log level.
 */
export const audit = {
  /**
   * @param {string} action - What happened (e.g. 'ARTICLE_CREATED', 'USER_DELETED')
   * @param {object} details - Structured context (userId, resourceId, etc.)
   */
  log(action, details = {}) {
    logger.info({ audit: true, action, ...details }, `[AUDIT] ${action}`);
  },
};
