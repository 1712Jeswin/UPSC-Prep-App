import { db } from '../../db/index.js';
import { quizzes, questions, submissions } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Quizzes repository — the ONLY file that touches Drizzle for quizzes.
 */

/**
 * Find quiz by article ID.
 * @param {string} articleId
 * @returns {Promise<object|null>}
 */
export const findQuizByArticleId = async (articleId) => {
  const result = await db.select().from(quizzes).where(eq(quizzes.articleId, articleId)).limit(1);
  return result[0] || null;
};

/**
 * Find quiz by its own ID.
 * @param {string} quizId
 * @returns {Promise<object|null>}
 */
export const findQuizById = async (quizId) => {
  const result = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
  return result[0] || null;
};

/**
 * Find all questions for a quiz.
 * @param {string} quizId
 * @returns {Promise<Array>}
 */
export const findQuestionsByQuizId = async (quizId) => {
  return db.select().from(questions).where(eq(questions.quizId, quizId));
};

/**
 * Insert a quiz submission record.
 * @param {object} submissionData
 * @returns {Promise<object>}
 */
export const createSubmission = async (submissionData) => {
  const [result] = await db.insert(submissions).values(submissionData).returning();
  return result;
};
