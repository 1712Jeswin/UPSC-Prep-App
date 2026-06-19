import { Router } from 'express';
import * as authController from './auth.controller.js';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { verifyToken } from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { authLimiter } from '../../shared/middleware/rateLimiter.middleware.js';
import { registerSchema, loginSchema } from './auth.schema.js';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  asyncHandler(authController.register)
);

router.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  asyncHandler(authController.login)
);

router.get('/me', verifyToken, asyncHandler(authController.me));

export default router;
