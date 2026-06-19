# instructions.md — Developer Implementation Guide
## UPSC Educational Platform — Backend

---

## 🔒 AI ASSISTANT OPERATING MODE (MANDATORY)

> **Read this block first. It governs every line of code you write.**

You are a **Senior Software Engineer (8+ years experience)** specializing in:
- Scalable backend architecture
- Production-grade Node.js systems
- Clean architecture (layered / modular design)
- Secure API design
- Backend–frontend contract stability

This is a **production SaaS backend**, not a demo project.

---

### 🧠 Core Expectation

Before writing any code, you MUST think:

> "Will this scale, remain maintainable, and not break existing systems?"

---

### 🧱 Architecture Discipline (STRICT)

You MUST strictly follow this layer separation — no exceptions:

| Layer | Responsibility | What it MUST NOT do |
|---|---|---|
| **Routes** | Define endpoints + attach middleware chain | No logic, no DB calls |
| **Controllers** | Parse `req`, call service, send `res` | No business logic, no DB calls |
| **Services** | ALL business logic, Zod validation, DB operations | No `req`/`res` objects |
| **Models** | Mongoose schema + indexes only | No business logic |
| **Middlewares** | Cross-cutting concerns only | No domain logic |

Never mix responsibilities. If you feel the urge to write DB code in a controller, stop and move it to the service.

---

### 🔗 Backend–Frontend Contract (CRITICAL)

You MUST **NEVER** change the API response structure. Every single endpoint — success or error — returns exactly this shape:

**Success:**
```json
{
  "success": true,
  "message": "Human-readable description",
  "data": {}
}
```

**Error:**
```json
{
  "success": false,
  "message": "What went wrong",
  "errors": []
}
```

Changing field names, nesting structure, or adding top-level keys **breaks the mobile and web clients immediately**. The frontend contract is frozen. Extend `data` if you need to return more — never add new top-level keys.

---

### ⛔ Hard Stops — Things You Must Never Do

- Do NOT write mock DB calls or hardcoded placeholder data
- Do NOT skip Zod validation on any route that accepts input
- Do NOT put business logic in routes or controllers
- Do NOT expose `passwordHash` or `refreshTokenHash` in any response
- Do NOT return stack traces when `NODE_ENV=production`
- Do NOT use `.find({})` without a filter and pagination
- Do NOT use `var` — only `const` / `let`
- Do NOT use CommonJS `require()` — this is an ES Modules project (`"type": "module"`)
- Do NOT skip `asyncHandler` wrapping on any async controller
- Do NOT store or suggest storing refresh tokens in `localStorage`
- Do NOT activate subscriptions based on client-side payment confirmation — always verify server-side

---

## 1. Project Overview

This is a production-grade Node.js/Express backend for a UPSC exam prep platform.
It serves both a **React Native mobile app** and a **React web app** via a versioned REST API.
All logic lives in the backend — clients are treated as untrusted consumers.

All files are created inside the `Backend/` folder. Every path in this document is relative to `Backend/`.

---

## 2. Prerequisites

```
Node.js        >= 20.x
PostgreSQL     >= 14.x (Neon or local)
npm            >= 10.x
```

---

## 3. Environment Setup

### Step 1 — Navigate to Backend folder and install

```bash
cd Backend
npm install
```

### Step 2 — Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

```env
# App
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://user:pass@host/db

# Better Auth
BETTER_AUTH_SECRET=<min-32-char-random-string>
BETTER_AUTH_URL=http://localhost:5000

# JWT
JWT_SECRET=<min-32-char-random-string>

# Gemini API
GEMINI_API_KEY=<your_api_key>

# CORS — comma-separated allowed origins
CORS_ORIGINS=http://localhost:3000,http://localhost:8081
```

> The server will **refuse to start** if any required variable is missing.
> This is enforced by `src/config/env.js` using Zod.

### Step 3 — Start development server

```bash
npm run dev
```

Expected output:
```
[env]    ✓ Environment validated
[server] ✓ Listening on port 5000
```

---

## 4. Folder Structure

All files live inside `Backend/`. The structure is:

```
Backend/
├── src/
│   ├── config/
│   │   └── env.js                        ← Zod env validation
│   ├── db/
│   │   ├── index.js                      ← Single Drizzle + Pool instance
│   │   └── schema.js                     ← All Drizzle table definitions + indexes
│   ├── shared/
│   │   ├── middleware/
│   │   │   ├── asyncHandler.js
│   │   │   ├── auth.middleware.js
│   │   │   ├── role.middleware.js
│   │   │   ├── rateLimiter.middleware.js
│   │   │   ├── validate.middleware.js     ← Zod request validation
│   │   │   └── error.middleware.js        ← Global error handler
│   │   ├── errors/
│   │   │   └── AppError.js               ← Error class hierarchy
│   │   ├── utils/
│   │   │   ├── apiResponse.js            ← Standardized response helpers
│   │   │   └── logger.js                 ← Pino structured logger
│   │   └── constants/
│   │       └── httpStatus.js
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.schema.js            ← Zod validation schemas
│   │   ├── articles/
│   │   ├── quizzes/
│   │   └── admin/
│   ├── lib/
│   │   └── auth.js                        ← Better Auth config
│   └── app.js                             ← Express app setup (middleware chain)
├── server.js                              ← Entry: env validate → db → app.listen()
├── drizzle.config.js
├── .env.example
└── package.json                       ← "type": "module"
```

Module folder pattern — every module contains exactly these four files:
```
<module>/
  <module>.routes.js       ← route declarations only
  <module>.controller.js   ← req/res handling only
  <module>.service.js      ← all business logic
  <module>.validation.js   ← Zod schemas for this module
```

**Database schema** → `src/db/schema.js` only, never inside a module folder.
**Shared utilities** → `src/shared/utils/` only.
**Cross-cutting middleware** → `src/shared/middleware/` only.

---

## 5. Implementation Order (Follow Strictly)

### Phase 1 — Infrastructure

Build in this exact order. Nothing else before this is complete.

1. `src/config/env.js` — Zod parse of all env vars. Export a typed `config` object. Server must not start if any required var is missing.
2. `src/shared/utils/apiResponse.js` — `sendSuccess(res, data, message, statusCode=200)` and `sendError(res, message, statusCode=500, errors=[])`. Both must produce the locked response shape.
3. `src/shared/errors/AppError.js` — `class AppError extends Error { constructor(statusCode, message, errors=[]) { ... this.isOperational = true } }`.
4. `src/shared/utils/logger.js` — Pino structured logger.
5. `src/shared/middleware/asyncHandler.js` — `export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)`.
6. `src/shared/middleware/error.middleware.js` — catches `AppError` and unknown errors, logs server-side, returns structured JSON. Never leaks stack in production.
7. `src/app.js` — register Helmet, CORS, body parsers (10kb limit), Better Auth handler, routes, error handler.
8. `server.js` — import `env.js` first, then `app.js`, then `app.listen()`.

### Phase 2 — Database Schema

Create all Drizzle schemas in `src/db/schema.js`. Add indexes on every frequently queried field. Run migrations using `npx drizzle-kit generate` and `npx drizzle-kit push`.

### Phase 3 — Authentication (Better Auth)

Configure Better Auth in `src/lib/auth.js` with plugins and JWT configuration. Expose it through `src/app.js`. Implement route protection in `src/shared/middleware/auth.middleware.js` using Better Auth session validation.

### Phase 4 — Current Affairs + AI Analyst

1. Article CRUD — POST/PATCH/DELETE restricted to `INSTRUCTOR` and `ADMIN`
2. `GET /api/v1/articles` — paginated via `paginate.utils.js`, filter by `?tag=` and `?date=`
3. `GET /api/v1/articles/:id` — single article detail
4. `POST /api/v1/articles/:id/read` — mark read + `awardXP(userId, 10, 'ARTICLE_READ')` + increment `UserStats.articlesRead`
5. `GET /api/v1/chat/:articleId` — fetch existing `ChatSession` for `user + article`
6. `POST /api/v1/chat/:articleId/message` — append user message, call AI API from `ai-analyst.service.js`, append AI response, return updated session

### Phase 5 — Gamification + Profile

1. `gamification.service.js`:
   - `awardXP(userId, amount, reason)` → `$inc xp`, recalculate `level = Math.floor(xp / 500) + 1`, `$set level`
2. `streakService.js` — called on every login:
   - `lastActivityDate` === yesterday → `$inc currentStreak`, update `highestStreak` if needed
   - `lastActivityDate` === today → skip (already counted)
   - Else → reset `currentStreak` to 1
   - Always update `lastActivityDate` to today
3. `GET /api/v1/users/me` — single query with populate on `Profile` + `UserStats`
4. `PATCH /api/v1/users/profile` — merge partial updates via `$set`. Block: `role`, `status`, `email`, `passwordHash`

### Phase 6 — Courses + Quiz Engine

1. Course/Lesson CRUD — write operations restricted to `INSTRUCTOR`/`ADMIN`
2. `GET /api/v1/courses` — paginated list
3. `GET /api/v1/courses/:id/lessons` — sorted by `orderIndex`
4. `GET /api/v1/quizzes/:id/questions` — strip `correctOptionIndex` from response
5. `POST /api/v1/quizzes/:id/submit`:
   - Validate answer array length matches question count
   - Calculate score
   - Create `Submission` document
   - If passed: `awardXP(userId, 50, 'QUIZ_PASS')`
   - Recalculate `UserStats.recallRatePercentage` as rolling average of all user submissions

### Phase 7 — Progress Tracker

1. `POST /api/v1/progress/:courseId/lesson/:lessonId/complete`:
   - `$addToSet completedLessons: lessonId` — prevents duplicates
   - Recalculate: `completionPercentage = (completedLessons.length / course.totalModules) * 100`
   - `awardXP(userId, 20, 'LESSON_COMPLETE')`
2. `GET /api/v1/progress/summary`:
   - Aggregate all `Progress` docs for the authenticated user
   - Populate `course.title` for each
   - Return: `[{ courseId, courseTitle, completionPercentage }]`

### Phase 8 — Subscriptions + Admin

1. `POST /api/v1/subscriptions/subscribe`:
   - Receive `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`
   - Verify HMAC signature server-side before creating anything
   - Create `Subscription` document only after verification passes
2. `GET /api/v1/subscriptions/my-plan` — return active subscription doc or `null`
3. `GET /api/v1/admin/dashboard-stats` — guarded by `checkRole('ADMIN')`. Aggregate:
   - Total registered users
   - Active subscribers
   - Total articles published
   - Total quiz submissions

---

## 6. Coding Conventions

### ES Modules — always include `.js` extension
```js
import express from 'express';
import { AppError } from '../utils/apiError.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
```

### Controller — thin, no logic
```js
export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  sendSuccess(res, result, 'Login successful');
});
```

### Service — all logic here
```js
export const login = async (body) => {
  const { email, password } = loginSchema.parse(body);
  const user = await db.query.user.findFirst({ where: eq(schema.user.email, email) });
  if (!user) throw new AppError(401, 'Invalid credentials');
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError(401, 'Invalid credentials');
  const accessToken = signAccessToken({ userId: user._id, role: user.role });
  return { accessToken, user };
};
```

### Model — schema + toJSON only
```js
// Drizzle models don't have toJSON, handle selection in queries

```

---

## 7. Route Naming Convention

```
GET    /api/v1/articles              ← list (paginated)
GET    /api/v1/articles/:id          ← detail
POST   /api/v1/articles              ← create (INSTRUCTOR/ADMIN)
PATCH  /api/v1/articles/:id          ← partial update
DELETE /api/v1/articles/:id          ← delete

POST   /api/v1/articles/:id/read     ← action on resource
POST   /api/v1/quizzes/:id/submit    ← action on resource
```

---

## 8. Error Handling Flow

```
Controller calls service
  → Service throws AppError (or Zod throws ZodError)
    → asyncHandler catches → next(err)
      → error.middleware.js catches
        → AppError:  return err.statusCode + err.message
        → ZodError:  return 422 + formatted field errors
        → Unknown:   return 500 + "Internal server error" (no details in prod)
        → Always:    log full error + stack via Winston
```

```js
// error.middleware.js
export const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
      ...(isDev && { stack: err.stack }),
    });
  }

  logger.error({ message: err.message, stack: err.stack, path: req.path });
  res.status(500).json({
    success: false,
    message: isDev ? err.message : 'Internal server error',
    errors: [],
  });
};
```

---

## 9. PR Checklist (before every commit)

- [ ] All new routes have Zod validation in the service
- [ ] All new routes have the correct role guard middleware
- [ ] All async controllers are wrapped with `asyncHandler`
- [ ] No `.find({})` without a filter and pagination
- [ ] No `passwordHash` or `refreshTokenHash` in any response
- [ ] No stack trace returned when `NODE_ENV=production`
- [ ] Rate limiter applied to new auth-adjacent routes
- [ ] Indexes added on new models for all queried/filtered fields
- [ ] API response shape matches `{ success, message, data }` contract

---

## 10. npm Scripts

```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "lint": "eslint src/",
    "test": "node --experimental-vm-modules node_modules/.bin/jest"
  }
}
```

---

## 11. Deployment Notes

- Run with **PM2** or Docker — never bare `node server.js` in production
- Set `NODE_ENV=production` — disables stack traces in error responses
- PostgreSQL: **Neon DB** or private instance.
- Reverse-proxy through **Nginx/Caddy** — never expose Node on port 80/443 directly
- TLS via Let's Encrypt or Caddy auto-TLS
- Set `app.set('trust proxy', 1)` if behind Nginx
