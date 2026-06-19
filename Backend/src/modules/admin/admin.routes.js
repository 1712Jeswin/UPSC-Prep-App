import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { verifyToken } from '../../shared/middleware/auth.middleware.js';
import { checkRole } from '../../shared/middleware/role.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { adminLimiter } from '../../shared/middleware/rateLimiter.middleware.js';
import { syncNewsBodySchema } from './admin.schema.js';

const router = Router();

// Secure all admin routes behind rate limiter + JWT verify + Admin role check
router.use(adminLimiter, verifyToken, checkRole('admin'));

// Trigger news and quiz automation compile
router.post(
  '/sync-news',
  validate({ body: syncNewsBodySchema }),
  asyncHandler(adminController.syncNewsEdition)
);

// Manual trigger for data lifecycle sweeper GC
router.post('/cleanup', asyncHandler(adminController.triggerDatabaseCleanup));

export default router;
