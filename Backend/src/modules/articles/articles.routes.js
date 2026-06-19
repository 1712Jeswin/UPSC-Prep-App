import { Router } from 'express';
import * as articlesController from './articles.controller.js';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { listArticlesQuerySchema, articleParamsSchema } from './articles.schema.js';

const router = Router();

// GET /api/articles — list with pagination + filters
router.get(
  '/',
  validate({ query: listArticlesQuerySchema }),
  asyncHandler(articlesController.list)
);

// GET /api/articles/:id — single article detail
router.get(
  '/:id',
  validate({ params: articleParamsSchema }),
  asyncHandler(articlesController.getById)
);

export default router;
