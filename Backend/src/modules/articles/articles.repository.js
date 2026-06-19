import { db } from '../../db/index.js';
import { articles } from '../../db/schema.js';
import { desc, eq, and } from 'drizzle-orm';

/**
 * Articles repository — the ONLY file that touches Drizzle for articles.
 */

/**
 * Find all articles with pagination and optional filters.
 * @param {number} limit
 * @param {number} offset
 * @param {{ tag?: string, edition?: string }} [filters={}]
 * @returns {Promise<Array>}
 */
export const findAll = async (limit, offset, filters = {}) => {
  const conditions = [];

  if (filters.tag) {
    conditions.push(eq(articles.syllabusTag, filters.tag));
  }
  if (filters.edition) {
    conditions.push(eq(articles.editionType, filters.edition));
  }

  const query = db
    .select()
    .from(articles)
    .orderBy(desc(articles.publishedDate))
    .limit(limit)
    .offset(offset);

  if (conditions.length > 0) {
    query.where(and(...conditions));
  }

  return query;
};

/**
 * Count total articles matching optional filters.
 * @param {{ tag?: string, edition?: string }} [filters={}]
 * @returns {Promise<number>}
 */
export const countAll = async (filters = {}) => {
  const { sql } = await import('drizzle-orm');
  const conditions = [];

  if (filters.tag) {
    conditions.push(eq(articles.syllabusTag, filters.tag));
  }
  if (filters.edition) {
    conditions.push(eq(articles.editionType, filters.edition));
  }

  const query = db.select({ count: sql`count(*)::int` }).from(articles);

  if (conditions.length > 0) {
    query.where(and(...conditions));
  }

  const [result] = await query;
  return result?.count ?? 0;
};

/**
 * Find a single article by ID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export const findById = async (id) => {
  const result = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return result[0] || null;
};
