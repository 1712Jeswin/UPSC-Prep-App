import { z } from 'zod';

/**
 * Zod schemas for articles module validation.
 */

/** Query params for listing articles. */
export const listArticlesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  tag: z.string().optional(),
  edition: z.enum(['MORNING', 'EVENING']).optional(),
});

/** Route params for single article by ID. */
export const articleParamsSchema = z.object({
  id: z.string().min(1, 'Article ID is required'),
});
