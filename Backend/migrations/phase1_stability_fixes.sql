-- ============================================================================
-- Phase 1 Stability Fixes — Safe Migration
-- Apply with: psql $DATABASE_URL -f migrations/phase1_stability_fixes.sql
--
-- ALL statements are idempotent / safe to re-run:
--   - ADD COLUMN IF NOT EXISTS  → no error if column exists
--   - CREATE UNIQUE INDEX IF NOT EXISTS → no error if index exists
--   - Each statement is a separate transaction step
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. structured_affair: UNIQUE constraint on raw_article_id
--
-- WHY: Prevents two concurrent AI-formatting calls for the same raw article
-- from both committing. ON CONFLICT DO NOTHING in application code catches
-- the constraint gracefully.
--
-- SAFE: Only adds an index; no existing rows are modified.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_structured_affair_raw_article_id_unique
    ON structured_affair (raw_article_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. quiz: generation_status column
--
-- WHY: Acts as a persistent in-flight lock. While a quiz generation job is
-- running, a sentinel row with status="pending" exists. Other workers check
-- for this sentinel and skip generation, preventing duplicate AI calls across
-- process restarts.
--
-- Default "completed": all existing rows are treated as complete legacy quizzes.
-- NULL existing rows are also treated as completed (see application logic).
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE quiz
    ADD COLUMN IF NOT EXISTS generation_status TEXT DEFAULT 'completed';

-- Back-fill any NULL values from legacy rows
UPDATE quiz SET generation_status = 'completed' WHERE generation_status IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. daily_session: affair_ids + quiz_ids snapshot columns
--
-- WHY: Locks the "today's 10 affairs" list at session creation time.
-- Without this, new articles inserted during the day silently shift the
-- progress denominator (the "moving target" bug).
--
-- JSONB chosen over TEXT[]: allows future GIN indexing if needed.
-- Existing sessions default to empty array — graceful degradation:
--   the service falls back to dynamic lookup for sessions without snapshots.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE daily_session
    ADD COLUMN IF NOT EXISTS affair_ids JSONB DEFAULT '[]'::jsonb;

ALTER TABLE daily_session
    ADD COLUMN IF NOT EXISTS quiz_ids JSONB DEFAULT '[]'::jsonb;


-- ─────────────────────────────────────────────────────────────────────────────
-- Verification queries (run manually to confirm migration applied)
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT indexname FROM pg_indexes WHERE tablename = 'structured_affair';
-- SELECT column_name, data_type, column_default FROM information_schema.columns
--   WHERE table_name IN ('quiz', 'daily_session')
--   ORDER BY table_name, ordinal_position;
