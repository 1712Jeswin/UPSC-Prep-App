/**
 * UPSC Platform — Server Entry Point
 *
 * Responsibilities:
 * 1. Validate environment variables (fails fast if invalid)
 * 2. Import the Express app
 * 3. Start listening
 * 4. Handle graceful shutdown
 */

// ─── 1. Env Validation (must be first import) ──────────────────
import { env } from './src/config/env.js';

// ─── 2. Import App ─────────────────────────────────────────────
import app from './src/app.js';
import { logger } from './src/shared/utils/logger.js';

// ─── 3. Start Server ───────────────────────────────────────────
const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, `Server running on http://localhost:${env.PORT}`);
});

// ─── 4. Graceful Shutdown ──────────────────────────────────────
const shutdown = (signal) => {
  logger.info({ signal }, 'Received shutdown signal, closing server...');
  server.close(() => {
    logger.info('Server closed gracefully');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch unhandled rejections and uncaught exceptions
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled Rejection');
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught Exception');
  shutdown('uncaughtException');
});