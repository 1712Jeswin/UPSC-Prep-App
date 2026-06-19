import crypto from 'crypto';
import * as quizzesRepo from './quizzes.repository.js';
import { NotFoundError } from '../../shared/errors/AppError.js';

/**
 * Quizzes service — all business logic for quizzes.
 */

/**
 * Get quiz for a specific article, with answer keys stripped.
 * @param {string} articleId
 * @returns {Promise<object>}
 * @throws {NotFoundError}
 */
export const getQuizForArticle = async (articleId) => {
  const quiz = await quizzesRepo.findQuizByArticleId(articleId);
  if (!quiz) {
    throw new NotFoundError('Quiz not found for this article');
  }

  const questionList = await quizzesRepo.findQuestionsByQuizId(quiz.id);

  // Strip correct answers and explanations to prevent client-side cheating
  const cleanQuestions = questionList.map((q) => ({
    id: q.id,
    quizId: q.quizId,
    text: q.text,
    options: JSON.parse(q.options),
  }));

  return {
    quizId: quiz.id,
    title: quiz.title,
    passingScore: quiz.passingScore,
    totalQuestions: quiz.totalQuestions,
    questions: cleanQuestions,
  };
};

/**
 * Submit quiz answers and return server-side grading.
 * @param {string} quizId
 * @param {number[]} answers - Array of selected option indices
 * @param {string} [studentId] - Optional user ID for persistence
 * @returns {Promise<object>}
 * @throws {NotFoundError}
 */
export const submitQuiz = async (quizId, answers, studentId) => {
  const quiz = await quizzesRepo.findQuizById(quizId);
  if (!quiz) {
    throw new NotFoundError('Quiz not found');
  }

  const questionList = await quizzesRepo.findQuestionsByQuizId(quiz.id);

  let score = 0;
  const evaluationResults = questionList.map((q, idx) => {
    const selectedIndex = answers[idx] !== undefined ? answers[idx] : -1;
    const isCorrect = selectedIndex === q.correctOptionIndex;
    if (isCorrect) score++;

    return {
      questionId: q.id,
      text: q.text,
      options: JSON.parse(q.options),
      correctOptionIndex: q.correctOptionIndex,
      selectedOptionIndex: selectedIndex,
      isCorrect,
      explanation: q.explanation || 'No explanation provided.',
    };
  });

  const passed = score >= quiz.passingScore;

  // Persist submission if user is authenticated
  if (studentId) {
    await quizzesRepo.createSubmission({
      id: crypto.randomUUID(),
      studentId,
      quizId: quiz.id,
      answers: JSON.stringify(answers),
      score,
      passed,
      attemptedAt: new Date(),
    });
  }

  return {
    score,
    passed,
    totalQuestions: quiz.totalQuestions,
    passingScore: quiz.passingScore,
    results: evaluationResults,
  };
};
