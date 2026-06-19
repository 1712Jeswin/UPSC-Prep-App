import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import { logger } from './shared/utils/logger.js';
import { globalErrorHandler } from './shared/middleware/error.middleware.js';
import { publicLimiter } from './shared/middleware/rateLimiter.middleware.js';

// Module routes
import authRoutes from './modules/auth/auth.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import articlesRoutes from './modules/articles/articles.routes.js';
import quizzesRoutes from './modules/quizzes/quizzes.routes.js';

const app = express();

// ─── 1. Security Headers ───────────────────────────────────────
app.use(helmet());

// ─── 2. CORS ────────────────────────────────────────────────────
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:8081'];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);

// ─── 3. Body Parser (10kb limit) ───────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ─── 4. Request Logging ────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
      },
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    );
  });
  next();
});

// ─── 5. Global Rate Limiting ───────────────────────────────────
app.use(publicLimiter);

// ─── 6. Better Auth Handler (must come before custom auth routes) ──
app.all('/api/auth/*', toNodeHandler(auth));

// ─── 7. Module Routes ──────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api', quizzesRoutes); // Mounts /api/articles/:articleId/quiz and /api/quizzes/:quizId/submit

// ─── 8. Health Check ───────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'UPSC Platform API is running 🚀',
  });
});

// ─── 9. Global Error Handler (MUST be last) ────────────────────
app.use(globalErrorHandler);

export default app;
