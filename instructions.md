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
MongoDB        >= 6.x  (Atlas or local)
Redis          >= 7.x  (Upstash or local)
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
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/upsc_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=<min-64-char-random-string>
JWT_REFRESH_SECRET=<different-min-64-char-random-string>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Bcrypt
BCRYPT_ROUNDS=12

# Cookies
COOKIE_SECRET=<min-32-char-random-string>

# CORS — comma-separated allowed origins
CORS_ORIGINS=http://localhost:3000,http://localhost:8081

# OTP
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=3

# Rate limits
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
OTP_RATE_LIMIT_MAX=3

# Email (Resend)
RESEND_API_KEY=re_xxxx

# Push (FCM)
FCM_SERVER_KEY=xxxx

# Payment (Razorpay)
RAZORPAY_KEY_ID=xxxx
RAZORPAY_KEY_SECRET=xxxx
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
[db]     ✓ MongoDB connected
[redis]  ✓ Redis connected
[server] ✓ Listening on port 5000
```

---

## 4. Folder Structure

All files live inside `Backend/`. The structure is:

```
Backend/
├── src/
│   ├── config/
│   │   ├── db.js                     ← mongoose.connect() with retry
│   │   ├── redis.js                  ← ioredis client singleton
│   │   └── env.js                    ← Zod env schema, validated at startup
│   ├── middlewares/
│   │   ├── auth.middleware.js         ← verifyToken (JWT)
│   │   ├── role.middleware.js         ← checkRole(...roles)
│   │   ├── subscription.middleware.js ← requirePremium
│   │   ├── rateLimiter.middleware.js
│   │   ├── asyncHandler.js            ← wraps async controllers
│   │   └── error.middleware.js        ← centralized error handler
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.validation.js
│   │   ├── users/
│   │   ├── courses/
│   │   ├── exams/
│   │   ├── current-affairs/
│   │   ├── gamification/
│   │   ├── subscriptions/
│   │   ├── notifications/
│   │   ├── ai-analyst/
│   │   └── admin/
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Profile.model.js
│   │   ├── UserStats.model.js
│   │   ├── Article.model.js
│   │   ├── ChatSession.model.js
│   │   ├── Course.model.js
│   │   ├── Lesson.model.js
│   │   ├── Quiz.model.js
│   │   ├── Question.model.js
│   │   ├── Submission.model.js
│   │   ├── Progress.model.js
│   │   ├── Achievement.model.js
│   │   └── Subscription.model.js
│   ├── utils/
│   │   ├── apiResponse.js             ← sendSuccess() + sendError()
│   │   ├── apiError.js                ← AppError class
│   │   ├── jwt.utils.js
│   │   ├── otp.utils.js
│   │   ├── paginate.utils.js          ← hard cap at limit: 50
│   │   └── logger.js                  ← Winston
│   ├── jobs/
│   │   ├── notification.job.js
│   │   └── streakReset.job.js
│   ├── routes/
│   │   └── index.js                   ← mounts all module routes
│   └── app.js                         ← Express setup, global middleware
├── server.js                          ← entry: env → db → app → listen
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

**Shared models** → `src/models/` only, never inside a module folder.
**Shared utilities** → `src/utils/` only.
**Cross-cutting middleware** → `src/middlewares/` only.

---

## 5. Implementation Order (Follow Strictly)

### Phase 1 — Infrastructure

Build in this exact order. Nothing else before this is complete.

1. `src/config/env.js` — Zod parse of all env vars. Export a typed `config` object. Server must not start if any required var is missing.
2. `src/config/db.js` — `mongoose.connect()` with retry logic and connection event logging.
3. `src/config/redis.js` — `ioredis` singleton client.
4. `src/utils/apiResponse.js` — `sendSuccess(res, data, message, statusCode=200)` and `sendError(res, message, statusCode=500, errors=[])`. Both must produce the locked response shape.
5. `src/utils/apiError.js` — `class AppError extends Error { constructor(statusCode, message, errors=[]) { ... this.isOperational = true } }`.
6. `src/utils/logger.js` — Winston logger with file + console transports.
7. `src/middlewares/asyncHandler.js` — `export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)`.
8. `src/middlewares/error.middleware.js` — catches `AppError` and unknown errors, logs server-side, returns structured JSON. Never leaks stack in production.
9. `src/app.js` — register Helmet, CORS, Morgan, body parsers (10kb limit), `express-mongo-sanitize`, routes, error handler.
10. `server.js` — import `env.js` first, then `db.js`, then `app.js`, then `app.listen()`.

### Phase 2 — Models

Create all Mongoose schemas in `src/models/`. Add indexes on every frequently queried field.

- [ ] `User.model.js` — `email` (unique index), `passwordHash` (excluded from default queries via `select: false`), `role` (enum: STUDENT/INSTRUCTOR/ADMIN), `status` (ACTIVE/INACTIVE/SUSPENDED), `refreshTokenHash`, `emailVerified`, `lastLoginAt`
- [ ] `Profile.model.js` — `user` (unique ref → User), `fullName`, `targetYear`, `optionalSubject`, `bio`, `attemptCount`, `dailyGoalHours`, `homeState`, `avatarUrl`
- [ ] `UserStats.model.js` — `user` (unique ref → User), `xp`, `level`, `currentStreak`, `highestStreak`, `lastActivityDate`, `articlesRead`, `recallRatePercentage`
- [ ] `Article.model.js` — `title`, `content`, `tag` (index), `source`, `imageColor`, `publishedDate` (desc index), `isPublished`
- [ ] `ChatSession.model.js` — `user` + `article` (compound index), `messages[]` with `{ role, text, timestamp }`
- [ ] `Course.model.js` — `title`, `description`, `totalModules`, `createdBy` (ref → User), `isPublished`
- [ ] `Lesson.model.js` — `course` (ref, index), `title`, `orderIndex`, `content`, `duration`
- [ ] `Quiz.model.js` — `course` or `lesson` ref, `title`, `passingScore`, `totalQuestions`
- [ ] `Question.model.js` — `quiz` (ref, index), `text`, `options[]`, `correctOptionIndex` (select: false), `explanation`
- [ ] `Submission.model.js` — `student` + `quiz` (compound index), `answers[]`, `score`, `passed`, `attemptedAt`
- [ ] `Progress.model.js` — `student` + `course` (compound unique index), `completedLessons[]`, `completionPercentage`
- [ ] `Achievement.model.js` — `user` (index), `badgeId`, `earnedAt`
- [ ] `Subscription.model.js` — `student` (index), `planType`, `status`, `startDate`, `expiryDate`, `paymentRef`

All models must have a `toJSON` transform that deletes `passwordHash`, `refreshTokenHash`, and `__v`.

### Phase 3 — Authentication

Implement in this exact order:

1. `auth.validation.js` — Zod schemas: `signupSchema`, `loginSchema`
2. `auth.service.js` — `signup()`, `login()`, `refreshTokens()`, `logout()`
3. `auth.controller.js` — calls service, sets cookie, calls `sendSuccess()`
4. `src/middlewares/auth.middleware.js` — `verifyToken`: reads `Authorization: Bearer` header, verifies JWT, confirms user still exists and is ACTIVE, attaches `req.user`
5. `src/middlewares/role.middleware.js` — `checkRole(...roles)`: checks `req.user.role` against allowed list
6. `src/middlewares/subscription.middleware.js` — `requirePremium`: queries `Subscription` for ACTIVE + non-expired record
7. `auth.routes.js` — mount all four auth routes

Refresh token cookie settings:
```js
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/v1/auth',
  signed: true,
}
```

On signup: auto-create empty `Profile` and `UserStats` documents in the same operation as the `User` document.

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
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) throw new AppError(401, 'Invalid credentials');
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new AppError(401, 'Invalid credentials');
  const accessToken = signAccessToken({ userId: user._id, role: user.role });
  return { accessToken, user };
};
```

### Model — schema + toJSON only
```js
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.refreshTokenHash;
    delete ret.__v;
    return ret;
  },
});
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
- MongoDB: **Atlas** with IP allowlist + dedicated `readWrite` user (not root)
- Redis: **Upstash** or private instance — never expose publicly
- Reverse-proxy through **Nginx/Caddy** — never expose Node on port 80/443 directly
- TLS via Let's Encrypt or Caddy auto-TLS
- Set `app.set('trust proxy', 1)` if behind Nginx
