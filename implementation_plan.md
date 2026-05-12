# Daily Current Affairs Pipeline

Build a production-ready pipeline: **RSS → Filter → Batch AI → DB → API → React Native frontend**, replacing static data in the Affairs tab with live API content.

---

## User Review Required

> [!IMPORTANT]
> **AI Provider Choice**: This plan uses **Google Gemini** (`@google/generative-ai`) since your project already uses Google Cloud (Google Auth). If you prefer OpenAI, let me know — the service layer swaps cleanly.

> [!IMPORTANT]
> **Environment Variable Needed**: You'll need a `GEMINI_API_KEY` added to your `.env`. You can get one free at [aistudio.google.com](https://aistudio.google.com).

> [!WARNING]
> **Database Migration**: Two new tables (`article`, `mcq`) will be created via Drizzle. You'll need to run `npm run db:generate` then `npm run db:migrate` after the schema is added.

---

## Open Questions

1. **AI Provider**: Gemini (recommended, free tier available) or OpenAI? Plan assumes Gemini.
2. **Admin auth**: The `POST /admin/generate` route — should it require `verifyToken` + admin role check, or is it okay to leave it open for now (no admin role middleware exists yet)?
3. **Scheduled runs**: Do you want a cron job (e.g., `node-cron`) to auto-trigger `generateDailyContent()` at a specific time, or is manual `POST /admin/generate` sufficient for now?

---

## Proposed Changes

### Backend — Database Schema

#### [MODIFY] [schema.js](file:///d:/90%20days%20challenge/UPSC-Platform/Backend/src/db/schema.js)

Add two new tables at the end of the existing schema:

**`article` table:**
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | Auto-generated |
| `title` | `text` | NOT NULL |
| `category` | `text` | e.g. "Economy", "Polity" |
| `source_link` | `text` | Original RSS link |
| `published_date` | `date` | RSS pubDate |
| `why_in_news` | `text` | AI-generated |
| `background` | `text` | AI-generated |
| `key_points` | `text` | JSON string array |
| `prelims_facts` | `text` | JSON string array |
| `mains_angle` | `text` | AI-generated |
| `source_name` | `text` | e.g. "PIB" |
| `created_at` | `timestamp` | Default now() |

**`mcq` table:**
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | Auto-generated |
| `article_id` | `uuid` (FK) | References article.id |
| `question` | `text` | NOT NULL |
| `options` | `text` | JSON string array |
| `answer` | `text` | Correct option text |
| `created_at` | `timestamp` | Default now() |

**Unique constraint**: `(source_link, published_date)` on `article` for deduplication.

---

### Backend — Current Affairs Module (4 new files)

#### [NEW] [currentAffairs.service.js](file:///d:/90%20days%20challenge/UPSC-Platform/Backend/src/modules/current-affairs/currentAffairs.service.js)

Full pipeline service with these functions:

| Function | Responsibility |
|---|---|
| `fetchRSSArticles()` | Parse PIB RSS feed via `rss-parser`, return `{ title, content, link, pubDate }` |
| `filterRelevantArticles(articles)` | Keyword filter (policy, scheme, bill, report, India, UN, economy, environment), return top 5–10 |
| `prepareBatchInput(articles)` | Trim content to ~500 chars, concatenate into single prompt string |
| `generateFromAI(batchText)` | Single Gemini API call, strict JSON output with structured UPSC analysis |
| `saveToDB(processedArticles)` | Insert articles + linked MCQs via Drizzle, skip duplicates using `ON CONFLICT DO NOTHING` |
| `generateDailyContent()` | Orchestrates full pipeline: fetch → filter → prepare → AI → save |
| `getDailyArticles(date?)` | Query today's articles, fallback to latest available if empty |
| `getArticleById(id)` | Single article with full analysis fields |
| `getMCQsByArticleId(id)` | All MCQs linked to an article |

#### [NEW] [currentAffairs.controller.js](file:///d:/90%20days%20challenge/UPSC-Platform/Backend/src/modules/current-affairs/currentAffairs.controller.js)

Thin controller — follows existing pattern from `auth.controller.js`:
- Uses `asyncHandler` wrapper
- Calls service functions
- Returns via `sendSuccess()` / `sendError()`

#### [NEW] [currentAffairs.routes.js](file:///d:/90%20days%20challenge/UPSC-Platform/Backend/src/modules/current-affairs/currentAffairs.routes.js)

```
POST   /admin/generate        → trigger pipeline (protected)
GET    /daily                  → today's articles list
GET    /article/:id            → full article detail
GET    /article/:id/mcqs       → MCQs for article
```

#### [NEW] [currentAffairs.validation.js](file:///d:/90%20days%20challenge/UPSC-Platform/Backend/src/modules/current-affairs/currentAffairs.validation.js)

Zod schemas for:
- `articleIdSchema` — validates UUID param
- `dailyQuerySchema` — validates optional `?date=YYYY-MM-DD`

---

### Backend — Wiring

#### [MODIFY] [server.js](file:///d:/90%20days%20challenge/UPSC-Platform/Backend/server.js)

Single addition:
```js
import currentAffairsRoutes from "./src/modules/current-affairs/currentAffairs.routes.js";
app.use("/api/current-affairs", currentAffairsRoutes);
```

---

### Backend — Dependencies

#### [MODIFY] [package.json](file:///d:/90%20days%20challenge/UPSC-Platform/Backend/package.json)

Add:
- `rss-parser` — RSS feed parsing
- `@google/generative-ai` — Gemini API client
- `uuid` — Generate article/mcq IDs

---

### Frontend — Affairs Tab

#### [MODIFY] [current-affairs.tsx](file:///d:/90%20days%20challenge/UPSC-Platform/Frontend/app/%28tabs%29/current-affairs.tsx)

Changes (UI layout untouched):
1. Remove hardcoded `DAILY_NEWS` array
2. Add `useEffect` to fetch `GET /api/current-affairs/daily` on mount
3. Add `loading`, `error`, `articles` state
4. Show loading spinner while fetching
5. Show "No articles available" empty state
6. Map API response to existing card structure (`tag` = category, `date` = published_date, etc.)
7. Pass `article.id` to navigation params

#### [MODIFY] [editorial-analyst.tsx](file:///d:/90%20days%20challenge/UPSC-Platform/Frontend/app/editorial-analyst.tsx)

Changes (UI layout untouched):
1. Read `id` from route params (already passed)
2. Fetch `GET /api/current-affairs/article/:id` on mount → populate title, why_in_news, background, key_points, etc.
3. Fetch `GET /api/current-affairs/article/:id/mcqs` → display in the "Final Recall Check" section
4. Replace `mockData` with API data
5. Replace static `tabContent` with actual AI-generated content from the article fields
6. Add loading/error states
7. Wire "Start Quiz Now" to show MCQs inline with option selection + answer reveal

---

## New Files Summary

| File | Location | Purpose |
|---|---|---|
| `currentAffairs.service.js` | `Backend/src/modules/current-affairs/` | Full pipeline logic |
| `currentAffairs.controller.js` | `Backend/src/modules/current-affairs/` | Thin request handlers |
| `currentAffairs.routes.js` | `Backend/src/modules/current-affairs/` | Route definitions |
| `currentAffairs.validation.js` | `Backend/src/modules/current-affairs/` | Zod validation schemas |

## Modified Files Summary

| File | Change |
|---|---|
| `Backend/src/db/schema.js` | Add `article` + `mcq` tables |
| `Backend/server.js` | Mount current-affairs routes |
| `Backend/package.json` | Add 3 dependencies |
| `Backend/.env` | Add `GEMINI_API_KEY` |
| `Frontend/app/(tabs)/current-affairs.tsx` | Replace static data with API fetch |
| `Frontend/app/editorial-analyst.tsx` | Replace mock data with API fetch + MCQ UI |

---

## Verification Plan

### Automated Tests

1. **Backend startup**: `npm run dev` — server starts without errors
2. **DB migration**: `npm run db:generate && npm run db:migrate` — tables created
3. **Pipeline test**: `curl -X POST http://localhost:5000/api/current-affairs/admin/generate` — should fetch RSS, process, and return saved articles
4. **Daily endpoint**: `curl http://localhost:5000/api/current-affairs/daily` — returns articles array
5. **Article detail**: `curl http://localhost:5000/api/current-affairs/article/:id` — returns full article
6. **MCQs**: `curl http://localhost:5000/api/current-affairs/article/:id/mcqs` — returns MCQs array

### Manual Verification

- Open Expo app → Affairs tab → verify articles load from API
- Tap article → verify detail screen shows AI-generated analysis
- Tap "Start Quiz Now" → verify MCQs render with selectable options
