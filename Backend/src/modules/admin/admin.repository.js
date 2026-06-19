import { db } from '../../db/index.js';
import { articles, quizzes, questions, rawNews, session, verification } from '../../db/schema.js';
import { sql } from 'drizzle-orm';

/**
 * Admin repository — extracts all Drizzle queries from admin.service.js.
 */

/**
 * Delete raw news older than the specified number of days.
 * @param {number} cutoffDays
 * @returns {Promise<void>}
 */
export const purgeStaleRawNews = async (cutoffDays = 3) => {
  await db.execute(
    sql`DELETE FROM ${rawNews} WHERE ${rawNews.fetchedAt} < NOW() - INTERVAL '1 day' * ${cutoffDays}`
  );
};

/**
 * Delete expired Better Auth sessions.
 * @returns {Promise<void>}
 */
export const purgeExpiredSessions = async () => {
  await db.execute(
    sql`DELETE FROM ${session} WHERE ${session.expiresAt} < NOW()`
  );
};

/**
 * Delete expired Better Auth verifications.
 * @returns {Promise<void>}
 */
export const purgeExpiredVerifications = async () => {
  await db.execute(
    sql`DELETE FROM ${verification} WHERE ${verification.expiresAt} < NOW()`
  );
};

/**
 * Insert a new article.
 * @param {object} data
 * @returns {Promise<object>}
 */
export const insertArticle = async (data) => {
  const [result] = await db.insert(articles).values(data).returning();
  return result;
};

/**
 * Insert a new quiz.
 * @param {object} data
 * @returns {Promise<object>}
 */
export const insertQuiz = async (data) => {
  const [result] = await db.insert(quizzes).values(data).returning();
  return result;
};

/**
 * Insert a single question.
 * @param {object} data
 * @returns {Promise<void>}
 */
export const insertQuestion = async (data) => {
  await db.insert(questions).values(data);
};

/**
 * Fetch raw news buffer entries with pagination.
 * @param {number} limit
 * @param {number} offset
 * @returns {Promise<Array>}
 */
export const fetchRawNewsBuffer = async (limit, offset) => {
  return db.select().from(rawNews).limit(limit).offset(offset);
};
