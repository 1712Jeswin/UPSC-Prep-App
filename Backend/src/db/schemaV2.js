import { pgTable, text, timestamp, boolean, integer, json, jsonb, unique } from "drizzle-orm/pg-core";
import { user, article } from "./schema.js";

/**
 * SCHEMA V2 — UPSC Learning Engine
 *
 * Changelog (Phase 1 stability fixes):
 *  - structuredAffair: added UNIQUE on raw_article_id to prevent duplicate
 *    AI-structured rows under concurrent requests.
 *  - quiz: added generation_status ("pending" | "completed") to guard
 *    against concurrent duplicate AI generation calls.
 *  - dailySession: added affair_ids + quiz_ids (jsonb arrays) so the
 *    "today's 10 affairs" snapshot is locked at first access and never
 *    changes mid-day (fixes the "moving target" bug).
 *
 * All changes are ADDITIVE — no existing columns removed or renamed.
 * Existing rows will have NULL for new columns, which is safe.
 */

// ─────────────────────────────────────────────────────────────────────────────
// structured_affair
// UNIQUE on raw_article_id: one structured row per raw article.
// ON CONFLICT DO NOTHING at insert site prevents duplicate AI calls racing in.
// ─────────────────────────────────────────────────────────────────────────────
export const structuredAffair = pgTable("structured_affair", {
    id: text("id").primaryKey(),
    rawArticleId: text("raw_article_id").notNull().unique().references(() => article.id),
    structuredContent: jsonb("structured_content"),
    category: text("category"),
    difficulty: text("difficulty"),
    createdAt: timestamp("created_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// user_progress
// ─────────────────────────────────────────────────────────────────────────────
export const userProgress = pgTable("user_progress", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id),
    affairId: text("affair_id").notNull().references(() => structuredAffair.id),
    isRead: boolean("is_read").default(false),
    readAt: timestamp("read_at"),
}, (table) => ({
    uniqueUserAffair: unique().on(table.userId, table.affairId)
}));

// ─────────────────────────────────────────────────────────────────────────────
// quiz
// generation_status: used as an in-flight lock.
//   - "pending"   → generation is in progress; other requests must skip.
//   - "completed" → quizzes are ready.
// NULL means the row is a fully complete legacy quiz (safe to treat as
// "completed" in all checks).
// ─────────────────────────────────────────────────────────────────────────────
export const quiz = pgTable("quiz", {
    id: text("id").primaryKey(),
    affairId: text("affair_id").notNull().references(() => structuredAffair.id),
    question: text("question").notNull(),
    options: json("options"),
    correctAnswer: text("correct_answer"),
    explanation: text("explanation"),
    // Phase 1 addition: generation lock flag (see quizGenerator.js)
    generationStatus: text("generation_status").default("completed"),
    createdAt: timestamp("created_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// user_quiz_attempt
// UNIQUE(user_id, quiz_id) already prevents duplicate DB inserts.
// Service layer deduplicates payload before hitting this constraint.
// ─────────────────────────────────────────────────────────────────────────────
export const userQuizAttempt = pgTable("user_quiz_attempt", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id),
    quizId: text("quiz_id").notNull().references(() => quiz.id),
    selectedAnswer: text("selected_answer"),
    isCorrect: boolean("is_correct"),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
    uniqueUserQuiz: unique().on(table.userId, table.quizId)
}));

// ─────────────────────────────────────────────────────────────────────────────
// daily_session
// Phase 1 additions:
//   - affair_ids: JSONB array of structuredAffair IDs locked at session
//     creation. All progress queries use this list — never re-fetch the
//     "top 10 articles" after the session is created.
//   - quiz_ids: JSONB array of quiz IDs for this session. Populated when
//     quiz is first unlocked, ensuring the quiz set is stable all day.
// ─────────────────────────────────────────────────────────────────────────────
export const dailySession = pgTable("daily_session", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id),
    date: text("date").notNull(), // YYYY-MM-DD
    totalAffairs: integer("total_affairs").default(0),
    completedCount: integer("completed_count").default(0),
    quizUnlocked: boolean("quiz_unlocked").default(false),
    // Phase 1: session snapshot columns — locked at first access
    affairIds: jsonb("affair_ids").default([]),  // string[]
    quizIds: jsonb("quiz_ids").default([]),       // string[]
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
    uniqueUserDate: unique().on(table.userId, table.date)
}));
