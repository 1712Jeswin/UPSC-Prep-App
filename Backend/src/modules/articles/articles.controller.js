import * as articlesService from './articles.service.js';
import { sendSuccess } from '../../shared/utils/apiResponse.js';

/**
 * Articles controller — thin handlers that parse req, call service, send res.
 */

/**
 * GET /api/articles
 * List articles with pagination and optional filters.
 */
export const list = async (req, res) => {
  const { page, limit, tag, edition } = req.query;
  const result = await articlesService.listArticles({ page, limit, tag, edition });

  return sendSuccess(res, 'Articles retrieved successfully', result.items, 200, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
};

/**
 * GET /api/articles/:id
 * Get a single article by ID.
 */
export const getById = async (req, res) => {
  const article = await articlesService.getArticleById(req.params.id);
  return sendSuccess(res, 'Article retrieved successfully', article);
};
