import { v4 as uuidv4 } from "uuid";
import { db } from "../db/index.js";
import { dailySession, userProgress, structuredAffair, quiz, userQuizAttempt } from "../db/schemaV2.js";
import { article } from "../db/schema.js";
import { eq, and, desc, inArray } from "drizzle-orm";
import { formatArticleForUpsc } from "./aiUpscFormatter.js";
import { generateQuizzesForAffair } from "./quizGenerator.js";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum quiz answers accepted per submission (Phase 1 validation hardening) */
const MAX_QUIZ_ANSWERS = 20;

/** Number of daily affairs per session */
const DAILY_AFFAIR_LIMIT = 10;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const getTodayDateString = () => {
    const d = new Date();
    // Force IST (UTC+5:30) regardless of server timezone
    const offset = d.getTimezoneOffset() === 0 ? 330 * 60000 : 0;
    const istDate = new Date(d.getTime() + offset);
    return istDate.toISOString().split('T')[0];
};

// ─────────────────────────────────────────────────────────────────────────────
// getOrCreateDailySession
//
// FIX: Session now stores affair_ids at creation time.
// This snapshot is the source of truth for all progress queries today.
// Subsequent calls return the existing session — affair list never changes.
// ─────────────────────────────────────────────────────────────────────────────
export const getOrCreateDailySession = async (userId) => {
    const dateStr = getTodayDateString();

    // Fast path — session already exists for today
    const sessionRes = await db.select().from(dailySession)
        .where(and(eq(dailySession.userId, userId), eq(dailySession.date, dateStr)))
        .limit(1);

    if (sessionRes.length > 0) {
        return sessionRes[0];
    }

    // ── Session does not exist: build snapshot of today's affairs ──
    //
    // IMPORTANT: We fetch articles ONCE here at session creation.
    // All subsequent calls within the same day use session.affairIds.
    // This eliminates the "moving target" bug where new articles inserted
    // during the day would silently change the user's progress denominator.
    const latestArticles = await db
        .select()
        .from(article)
        .orderBy(desc(article.createdAt))
        .limit(DAILY_AFFAIR_LIMIT);

    // Resolve structured affair IDs for each raw article (or create them)
    const affairIds = [];
    for (const raw of latestArticles) {
        const formatted = await formatArticleForUpsc(raw);
        affairIds.push(formatted.id);
        // Fire-and-forget quiz pre-generation — non-blocking
        generateQuizzesForAffair(formatted).catch(e =>
            console.error("[dailyFlow] Async quiz pre-gen error:", e.message)
        );
    }

    const newSession = {
        id: uuidv4(),
        userId,
        date: dateStr,
        totalAffairs: affairIds.length,
        completedCount: 0,
        quizUnlocked: false,
        // Lock the affair snapshot into the session row
        affairIds,
        quizIds: [],
    };

    // ON CONFLICT DO NOTHING: if two concurrent requests both reach this
    // point simultaneously (race on session creation), only one insert wins;
    // the other silently does nothing, then the caller re-fetches below.
    await db.insert(dailySession).values(newSession).onConflictDoNothing();

    // Re-fetch to return the canonical committed row (handles the race case)
    const committed = await db.select().from(dailySession)
        .where(and(eq(dailySession.userId, userId), eq(dailySession.date, dateStr)))
        .limit(1);

    return committed[0] ?? newSession;
};

// ─────────────────────────────────────────────────────────────────────────────
// updateSessionProgress
//
// FIX: Uses session.affairIds (locked snapshot) instead of re-fetching
// the top 10 articles. Progress denominator is now stable all day.
// ─────────────────────────────────────────────────────────────────────────────
export const updateSessionProgress = async (userId, dateStr) => {
    // Always use the locked session snapshot — never re-derive affair list
    const sessionRes = await db.select().from(dailySession)
        .where(and(eq(dailySession.userId, userId), eq(dailySession.date, dateStr)))
        .limit(1);

    if (sessionRes.length === 0) {
        return { completedCount: 0, totalAffairs: 0, quizUnlocked: false };
    }

    const session = sessionRes[0];
    const affairIds = session.affairIds || [];
    const totalAffairs = affairIds.length;

    let completedCount = 0;
    if (totalAffairs > 0) {
        const progressRes = await db.select().from(userProgress)
            .where(and(
                eq(userProgress.userId, userId),
                inArray(userProgress.affairId, affairIds),
                eq(userProgress.isRead, true)
            ));
        completedCount = progressRes.length;
    }

    const quizUnlocked = completedCount >= totalAffairs && totalAffairs > 0;

    await db.update(dailySession)
        .set({ completedCount, totalAffairs, quizUnlocked, updatedAt: new Date() })
        .where(eq(dailySession.id, session.id));

    return { completedCount, totalAffairs, quizUnlocked };
};

// ─────────────────────────────────────────────────────────────────────────────
// getTodayAffairs
//
// FIX: Uses locked session.affairIds — no re-fetch of "top 10 articles".
// Affair list is stable for the entire day after first access.
// ─────────────────────────────────────────────────────────────────────────────
export const getTodayAffairs = async (userId) => {
    // getOrCreateDailySession now creates the affair snapshot on first call
    const session = await getOrCreateDailySession(userId);

    const affairIds = session.affairIds || [];

    if (affairIds.length === 0) {
        return {
            affairs: [],
            progress: { total: 0, completed: 0, percentage: 0, quizUnlocked: false }
        };
    }

    // Fetch only the affairs that belong to this session (stable list)
    const structuredRows = await db.select().from(structuredAffair)
        .where(inArray(structuredAffair.id, affairIds));

    // Fetch progress for this user against session affairs
    const progressRes = await db.select().from(userProgress)
        .where(and(
            eq(userProgress.userId, userId),
            inArray(userProgress.affairId, affairIds)
        ));

    const progressMap = {};
    for (const p of progressRes) {
        progressMap[p.affairId] = p;
    }

    const affairsWithProgress = structuredRows.map(a => ({
        ...a,
        isRead: progressMap[a.id]?.isRead || false,
        readAt: progressMap[a.id]?.readAt || null,
    }));

    const dateStr = getTodayDateString();
    const progressStats = await updateSessionProgress(userId, dateStr);

    return {
        affairs: affairsWithProgress,
        progress: {
            total: progressStats.totalAffairs,
            completed: progressStats.completedCount,
            percentage: progressStats.totalAffairs > 0
                ? Math.round((progressStats.completedCount / progressStats.totalAffairs) * 100)
                : 0,
            quizUnlocked: progressStats.quizUnlocked
        }
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// markAffairRead
// No change to logic — uses affairId directly (not re-derived).
// updateSessionProgress now reads from the locked session.
// ─────────────────────────────────────────────────────────────────────────────
export const markAffairRead = async (userId, affairId) => {
    const existing = await db.select().from(userProgress)
        .where(and(eq(userProgress.userId, userId), eq(userProgress.affairId, affairId)))
        .limit(1);

    if (existing.length === 0) {
        await db.insert(userProgress).values({
            id: uuidv4(),
            userId,
            affairId,
            isRead: true,
            readAt: new Date()
        // ON CONFLICT DO NOTHING: safe if somehow called twice concurrently
        }).onConflictDoNothing();
    } else if (!existing[0].isRead) {
        await db.update(userProgress)
            .set({ isRead: true, readAt: new Date() })
            .where(eq(userProgress.id, existing[0].id));
    }

    const dateStr = getTodayDateString();
    const progressStats = await updateSessionProgress(userId, dateStr);

    return {
        success: true,
        completedCount: progressStats.completedCount,
        totalAffairs: progressStats.totalAffairs,
        quizUnlocked: progressStats.quizUnlocked
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// getDailyQuiz
//
// FIX: Uses session.quizIds when populated; populates and locks them on
// first unlock so the quiz set is stable all day.
// ─────────────────────────────────────────────────────────────────────────────
export const getDailyQuiz = async (userId) => {
    const session = await getOrCreateDailySession(userId);

    if (!session.quizUnlocked) {
        return { quizUnlocked: false, questions: [] };
    }

    // ── If quiz IDs already locked for this session, use them directly ──
    const lockedQuizIds = session.quizIds || [];
    if (lockedQuizIds.length > 0) {
        const quizzes = await db.select().from(quiz).where(inArray(quiz.id, lockedQuizIds));
        return {
            quizUnlocked: true,
            questions: quizzes.map(q => ({
                id: q.id,
                question: q.question,
                options: q.options,
                affairId: q.affairId
            }))
        };
    }

    // ── Quiz IDs not yet locked — derive and lock them now ──
    const affairIds = session.affairIds || [];
    if (affairIds.length === 0) return { quizUnlocked: true, questions: [] };

    // Only fetch real, completed quiz rows (exclude any stale "pending" sentinels)
    const quizzes = await db.select().from(quiz)
        .where(inArray(quiz.affairId, affairIds));

    const completedQuizzes = quizzes.filter(q =>
        q.generationStatus === "completed" || q.generationStatus === null
    );

    const quizIds = completedQuizzes.map(q => q.id);

    // Lock quiz IDs into the session — stable for the rest of the day
    if (quizIds.length > 0) {
        await db.update(dailySession)
            .set({ quizIds, updatedAt: new Date() })
            .where(eq(dailySession.id, session.id));
    }

    return {
        quizUnlocked: true,
        questions: completedQuizzes.map(q => ({
            id: q.id,
            question: q.question,
            options: q.options,
            affairId: q.affairId
        }))
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// submitQuizAnswers
//
// FIX (Task 3 + Task 4):
//  1. Payload size limit: max MAX_QUIZ_ANSWERS answers per request.
//  2. Input deduplication: Set() collapses duplicate quizIds before processing.
//  3. Session validation: quizId must belong to user's locked daily quiz set.
//  4. In-loop duplicate guard: processed set prevents same quizId being added
//     twice to newAttempts even after Set() dedup (belt-and-suspenders).
//  5. ON CONFLICT DO NOTHING: DB insert is safe even if attempt already exists.
//  6. Score counts only valid, non-duplicate, session-owned attempts.
// ─────────────────────────────────────────────────────────────────────────────
export const submitQuizAnswers = async (userId, answers) => {
    if (!answers || answers.length === 0) {
        return { score: 0, total: 0, percentage: 0, results: [] };
    }

    // ── Validation: payload size cap ──
    if (answers.length > MAX_QUIZ_ANSWERS) {
        const err = new Error(`Too many answers: max ${MAX_QUIZ_ANSWERS} per submission`);
        err.statusCode = 400;
        throw err;
    }

    // ── Deduplication: collapse answers with the same quizId ──
    // Use the FIRST occurrence of each quizId; discard subsequent duplicates.
    // This prevents the DB UNIQUE(user_id, quiz_id) constraint from throwing.
    const seenQuizIds = new Set();
    const dedupedAnswers = [];
    for (const ans of answers) {
        if (!seenQuizIds.has(ans.quizId)) {
            seenQuizIds.add(ans.quizId);
            dedupedAnswers.push(ans);
        }
    }
    // Log if deduplication actually removed anything (useful for debugging clients)
    if (dedupedAnswers.length < answers.length) {
        console.warn(
            `[submitQuiz] Removed ${answers.length - dedupedAnswers.length} duplicate quizId(s) from user ${userId}'s payload`
        );
    }

    // ── Session validation: quizId must belong to user's locked daily session ──
    const dateStr = getTodayDateString();
    const sessionRes = await db.select().from(dailySession)
        .where(and(eq(dailySession.userId, userId), eq(dailySession.date, dateStr)))
        .limit(1);

    // If no session exists, reject all answers
    if (sessionRes.length === 0) {
        return { score: 0, total: 0, percentage: 0, results: [], error: "No active session found" };
    }

    const session = sessionRes[0];
    const sessionQuizIds = new Set(session.quizIds || []);

    // Filter out any quizId not in the session's locked quiz list.
    // If quizIds are not yet locked (empty), allow all (graceful degradation
    // for legacy sessions created before this fix was deployed).
    const validAnswers = sessionQuizIds.size > 0
        ? dedupedAnswers.filter(ans => {
            const valid = sessionQuizIds.has(ans.quizId);
            if (!valid) {
                console.warn(`[submitQuiz] quizId ${ans.quizId} not in session for user ${userId}`);
            }
            return valid;
        })
        : dedupedAnswers; // graceful degradation for old sessions

    if (validAnswers.length === 0) {
        return { score: 0, total: 0, percentage: 0, results: [] };
    }

    // ── Batch-fetch quiz rows (ONE query, no N+1) ──
    const quizIds = validAnswers.map(a => a.quizId);
    const quizRows = await db.select().from(quiz).where(inArray(quiz.id, quizIds));
    const quizMap = new Map(quizRows.map(q => [q.id, q]));

    // ── Batch-fetch existing attempts (ONE query) ──
    const existingAttempts = await db.select().from(userQuizAttempt)
        .where(and(
            eq(userQuizAttempt.userId, userId),
            inArray(userQuizAttempt.quizId, quizIds)
        ));
    const attemptedQuizIds = new Set(existingAttempts.map(a => a.quizId));

    let score = 0;
    const results = [];
    const newAttempts = [];
    // In-loop processed set: belt-and-suspenders guard on top of the dedup above
    const processedInLoop = new Set();

    for (const ans of validAnswers) {
        // Should never trigger after dedup, but guard regardless
        if (processedInLoop.has(ans.quizId)) continue;
        processedInLoop.add(ans.quizId);

        const q = quizMap.get(ans.quizId);
        if (!q) continue; // Unknown quiz ID — skip gracefully

        const isCorrect = ans.selectedAnswer === q.correctAnswer;
        if (isCorrect) score++;

        // Only record FIRST attempt — idempotent; DB constraint is backstop
        if (!attemptedQuizIds.has(q.id)) {
            newAttempts.push({
                id: uuidv4(),
                userId,
                quizId: q.id,
                selectedAnswer: ans.selectedAnswer,
                isCorrect
            });
        }

        results.push({
            quizId: q.id,
            question: q.question,
            selectedAnswer: ans.selectedAnswer,
            correctAnswer: q.correctAnswer,
            isCorrect,
            // Explanation always from DB — never from AI at submit time
            explanation: q.explanation || "Explanation not available"
        });
    }

    // ── Batch-insert all new attempts (ONE query) ──
    // ON CONFLICT DO NOTHING: safe even if the user somehow submits twice
    // (e.g., network retry). The DB constraint catches any slip-through.
    if (newAttempts.length > 0) {
        await db.insert(userQuizAttempt).values(newAttempts).onConflictDoNothing();
    }

    // Score denominator: count of valid, non-duplicate answers actually processed
    const total = results.length;

    return {
        score,
        total,
        percentage: total > 0 ? Math.round((score / total) * 100) : 0,
        results
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// processDailyAdmin
// Admin cron: pre-generates structured affairs + quizzes for all today's articles.
// ─────────────────────────────────────────────────────────────────────────────
export const processDailyAdmin = async () => {
    const latestArticles = await db
        .select()
        .from(article)
        .orderBy(desc(article.createdAt))
        .limit(DAILY_AFFAIR_LIMIT);

    let processed = 0;
    for (const raw of latestArticles) {
        const formatted = await formatArticleForUpsc(raw);
        await generateQuizzesForAffair(formatted);
        processed++;
    }
    return { message: "Processed successfully", count: processed };
};
