import { Router } from 'express';
import * as quizzesController from './quizzes.controller.js';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import {
  quizByArticleParamsSchema,
  quizSubmitParamsSchema,
  submitQuizBodySchema,
} from './quizzes.schema.js';

const router = Router();

// GET /api/articles/:articleId/quiz — get quiz (answer keys stripped)
router.get(
  '/articles/:articleId/quiz',
  validate({ params: quizByArticleParamsSchema }),
  asyncHandler(quizzesController.getQuiz)
);

// POST /api/quizzes/:quizId/submit — submit answers for grading
router.post(
  '/quizzes/:quizId/submit',
  validate({ params: quizSubmitParamsSchema, body: submitQuizBodySchema }),
  asyncHandler(quizzesController.submit)
);

export default router;
