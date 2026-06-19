import * as articlesRepo from './articles.repository.js';
import { NotFoundError } from '../../shared/errors/AppError.js';

/**
 * Articles service — all business logic for articles.
 */

/**
 * List articles with pagination and optional filters.
 * @param {{ page: number, limit: number, tag?: string, edition?: string }} query
 * @returns {Promise<{ items: Array, page: number, limit: number, total: number, totalPages: number }>}
 */
export const listArticles = async ({ page, limit, tag, edition }) => {
  const offset = (page - 1) * limit;
  const filters = {};
  if (tag) filters.tag = tag;
  if (edition) filters.edition = edition;

  const [items, total] = await Promise.all([
    articlesRepo.findAll(limit, offset, filters),
    articlesRepo.countAll(filters),
  ]);

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get a single article by ID.
 * @param {string} id
 * @returns {Promise<object>}
 * @throws {NotFoundError} If article not found
 */
export const getArticleById = async (id) => {
  const article = await articlesRepo.findById(id);
  if (!article) {
    throw new NotFoundError('Article not found');
  }
  return article;
};
