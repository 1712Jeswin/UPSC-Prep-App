import { z } from 'zod';

/**
 * Zod schemas for admin module validation.
 */

/** Body schema for sync-news endpoint. */
export const syncNewsBodySchema = z.object({
  editionType: z.enum(['MORNING', 'EVENING']).optional().default('MORNING'),
  forceDemo: z.boolean().optional().default(false),
});
