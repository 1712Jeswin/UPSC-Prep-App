# GEMINI.md — AI Assistant Context for UPSC Platform Backend


## 🔒 AI ASSISTANT OPERATING MODE (MANDATORY)

> **This block activates before anything else. All code you generate must comply.**

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

Changing field names, nesting, or adding top-level keys **breaks the mobile and web clients immediately**. The contract is frozen. Extend `data` if you need to return more — never add new top-level keys.

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
- Do NOT activate subscriptions on client-side confirmation — always verify server-side

---

## Project Identity

**Name:** UPSC Educational Platform Backend
**Type:** SaaS — Web + Mobile (React Native/Expo)
**Purpose:** Full-stack backend for UPSC exam preparation — courses, quizzes, current affairs, AI editorial analysis, gamification, subscriptions
**Stage:** Active development — Phase 1–8 defined, incremental delivery
**Root folder:** `Backend/` — all paths are relative to this

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules — `"type": "module"`) |
| Framework | Express.js 5 |
| Database | PostgreSQL via Drizzle ORM (Neon DB) |
| Validation | Zod (all request payloads and env vars) |
| Auth & Sessions | Better Auth |
| Logging | Pino (Structured logger) |
| Rate limiting | express-rate-limit |
| Security headers | Helmet.js |
| Environment | dotenv + Zod schema validated at startup |
| API style | RESTful — versioned at `/api/v1/` |

---

## Folder Structure

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
└── package.json                ← "type": "module"
```

---

## Architecture Principles (NEVER violate these)

1. **Routes** → only declare route + middleware chain. No logic.
2. **Controllers** → thin. Parse `req`, call service, call `sendSuccess()`. Nothing else.
3. **Services** → all business logic lives here. Zod validation runs here.
4. **Models** → Drizzle schema only. No business logic.
5. **Middlewares** → cross-cutting concerns only (auth, roles, rate limit, error).
6. **Backend never trusts frontend input** — validate everything with Zod before it touches the DB.
7. **All async controllers wrapped in `asyncHandler`** — no raw try/catch in controllers.
8. **All errors thrown as `new AppError(statusCode, message)`** — caught by central middleware.

---

## User Roles & Permissions

| Role | Can Do |
|---|---|
| `STUDENT` | Read articles, take quizzes, manage own profile, subscribe |
| `INSTRUCTOR` | All STUDENT permissions + create/edit courses, lessons, quizzes |
| `ADMIN` | Full access including admin dashboard, user management, subscriptions |

Route guard usage:
```js
router.get('/admin/stats', verifyToken, checkRole('ADMIN'), controller)
router.get('/premium-quiz', verifyToken, requirePremium, controller)
```

---

## Authentication Flow

The backend uses **Better Auth** mounted at `/api/auth` which automatically handles:
- Sign Up & Login (Email/Password)
- Session Management & Validation
- CSRF Protection
- JWT / Session cookie management automatically configured based on `BETTER_AUTH_SECRET`.

---

## API Response Contract

All responses must follow this shape — this is the frozen frontend contract:

```json
{
  "success": true,
  "message": "Human-readable description",
  "data": {}
}
```

Error responses:
```json
{
  "success": false,
  "message": "What went wrong",
  "errors": []
}
```

**Never** expose: stack traces, internal error messages, DB query details, or field names in production.

---

## Database Indexing Rules

Always index:
- `articles.publishedDate` — descending sort index
- `articles.syllabusTag` — filter index
- `articles.editionType` — filter index
- `quizzes.articleId` — FK lookup index
- `questions.quizId` — FK lookup index
- `submissions.studentId` — lookup index
- `submissions.quizId` — lookup index
- `chatSession.userId + articleId` — compound index

---

## Pagination Contract

Every list endpoint accepts `?page=1&limit=20`.
`limit` is capped at `50` server-side using `paginate.utils.js` — never trust client-provided limit.
Response `data` object includes: `{ items, page, limit, total, totalPages }`.

---

## Phase Implementation Plan

| Phase | Scope |
|---|---|
| 1 | Infrastructure: Express, Mongoose, Redis, env validation, error handling, logging |
| 2 | Core schemas: all 13 Mongoose models with indexes |
| 3 | Auth system: signup, login, refresh, logout + all auth middleware |
| 4 | Current affairs + AI Analyst chat engine |
| 5 | Gamification engine + profile management |
| 6 | Courses, lessons, quiz engine |
| 7 | Progress tracker + syllabus completion |
| 8 | Subscription engine + admin dashboard |

---

## Subscription Tiers

| Plan | Price | Duration |
|---|---|---|
| MONTHLY | ₹299 | 30 days |
| QUARTERLY | ₹699 | 90 days |
| YEARLY | ₹1999 | 365 days |

Premium-gated content: advanced quizzes, full editorial AI analysis.
`requirePremium` middleware checks `Subscription.status === 'ACTIVE'` and `expiryDate > now`.

---

## XP / Gamification Rules

| Action | XP Awarded |
|---|---|
| Read an article | +10 XP |
| Pass a quiz | +50 XP |
| Complete a lesson | +20 XP |
| Daily login streak | +5 XP/day |

Level formula: `level = Math.floor(xp / 500) + 1` (adjustable constant).
All XP awards go through `gamificationService.awardXP(userId, amount, reason)` — the only entry point.

---

## Environment Variables Required

```
NODE_ENV
PORT
DATABASE_URL             (postgresql://...)
BETTER_AUTH_SECRET       (min 32 chars)
BETTER_AUTH_URL          (http://localhost:5000)
JWT_SECRET               (min 32 chars)
GEMINI_API_KEY
CORS_ORIGINS             (comma-separated)
```

Server will not start if any required var is missing — Zod throws at boot before any routes register.
