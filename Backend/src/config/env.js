import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file before validation
dotenv.config();

/**
 * Zod schema for all required environment variables.
 * Server refuses to start if any required var is missing or invalid.
 *
 * NOTE: JWT_SECRET minimum is 20 to accommodate the current key during migration.
 *       It should be raised to 64 after secret rotation.
 */
const envSchema = z.object({
  // Server
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z
    .string({ required_error: 'DATABASE_URL is required' })
    .startsWith('postgresql://', 'DATABASE_URL must be a PostgreSQL connection string'),

  // Auth — Better Auth
  BETTER_AUTH_SECRET: z
    .string({ required_error: 'BETTER_AUTH_SECRET is required' })
    .min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  BETTER_AUTH_URL: z.string().url().optional(),

  // Auth — Custom JWT
  JWT_SECRET: z
    .string({ required_error: 'JWT_SECRET is required' })
    .min(20, 'JWT_SECRET must be at least 20 characters (raise to 64 after rotation)'),

  // External APIs
  GEMINI_API_KEY: z.string({ required_error: 'GEMINI_API_KEY is required' }).min(1),

  // Optional
  CORS_ORIGINS: z.string().optional().default('http://localhost:8081'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).optional(),
  DEMO_INGEST_MODE: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
});

/** @type {z.infer<typeof envSchema>} */
let env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error('\n❌ Environment validation failed:\n');
  if (error instanceof z.ZodError) {
    for (const issue of error.issues) {
      console.error(`  → ${issue.path.join('.')}: ${issue.message}`);
    }
  }
  console.error('\nServer cannot start with invalid environment configuration.\n');
  process.exit(1);
}

export { env };
