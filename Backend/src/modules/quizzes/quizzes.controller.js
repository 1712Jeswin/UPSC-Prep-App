import * as quizzesService from './quizzes.service.js';
import { sendSuccess } from '../../shared/utils/apiResponse.js';

/**
 * Quizzes controller — thin handlers that parse req, call service, send res.
 */

/**
 * GET /api/articles/:articleId/quiz
 * Get quiz for a specific article (answer keys stripped).
 */
export const getQuiz = async (req, res) => {
  const data = await quizzesService.getQuizForArticle(req.params.articleId);
  return sendSuccess(res, 'Quiz retrieved successfully', data);
};

/**
 * POST /api/quizzes/:quizId/submit
 * Submit quiz answers and get instant server-side grading.
 */
export const submit = async (req, res) => {
  const { answers, studentId } = req.body;
  const data = await quizzesService.submitQuiz(req.params.quizId, answers, studentId);
  return sendSuccess(res, 'Quiz submitted successfully', data);
};
