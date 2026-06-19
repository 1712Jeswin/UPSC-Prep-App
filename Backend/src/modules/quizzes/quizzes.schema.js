import { z } from 'zod';

/**
 * Zod schemas for quizzes module validation.
 */

/** Route params for quiz by article ID. */
export const quizByArticleParamsSchema = z.object({
  articleId: z.string().min(1, 'Article ID is required'),
});

/** Route params for quiz submission. */
export const quizSubmitParamsSchema = z.object({
  quizId: z.string().min(1, 'Quiz ID is required'),
});

/** Body schema for quiz submission. */
export const submitQuizBodySchema = z.object({
  answers: z.array(z.number().int()).min(1, 'Answers array must not be empty'),
  studentId: z.string().optional(),
});
