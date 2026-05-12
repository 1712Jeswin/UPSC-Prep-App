import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/index.js";
import { quiz } from "../db/schemaV2.js";
import { eq, sql } from "drizzle-orm";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * In-memory generation lock: affairId → Promise<quiz[]>
 *
 * WHY: Even with DB-level UNIQUE constraints, two concurrent Node.js
 * requests can both pass the "does quiz exist?" check before either
 * has committed anything. The in-memory lock ensures that within a
 * single process only ONE Promise runs for a given affairId; all other
 * callers await the same Promise and get back the same result.
 *
 * Limitation: This is per-process only. If you ever run multiple
 * Node.js workers (cluster / PM2), add a Redis lock (SET NX EX).
 * For a single-process deployment this is fully sufficient.
 */
const generationLocks = new Map(); // Map<affairId, Promise<quiz[]>>

/**
 * Strips markdown code fences from AI output — handles ```json, ```, and
 * edge cases where the model ignores the "no markdown" instruction.
 */
const extractJSON = (raw) => {
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) return match[1].trim();
    return raw.trim();
};

/**
 * Generates exactly 2 MCQs for a structured affair and persists them.
 *
 * Concurrency strategy (layered defence):
 *  1. In-memory lock  — prevents duplicate AI calls within the same process.
 *  2. DB UNIQUE index — "generation_status" sentinel row prevents duplicates
 *     across restarts (idempotency persisted to DB).
 *  3. ON CONFLICT DO NOTHING — safe insert even if another process somehow
 *     races past both checks.
 *
 * AI is called ONLY here (content creation stage), NEVER during user submission.
 *
 * @param {object} structuredAffairData - Row from structuredAffair table
 * @returns {Promise<object[]>} Array of stored quiz rows
 */
export const generateQuizzesForAffair = async (structuredAffairData) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    const affairId = structuredAffairData.id;

    // ── Layer 1: Return immediately if another coroutine is already generating ──
    if (generationLocks.has(affairId)) {
        // Await and return the in-flight result; no duplicate AI call.
        return generationLocks.get(affairId);
    }

    // ── Layer 2: DB check — idempotency across process restarts ──
    // We check for ANY quiz row for this affair (including "pending" sentinels).
    // This is safe because the in-memory lock handles concurrent same-process
    // requests, and the DB check handles cross-restart idempotency.
    const existing = await db
        .select({ id: quiz.id, generationStatus: quiz.generationStatus })
        .from(quiz)
        .where(eq(quiz.affairId, affairId));

    if (existing.length > 0) {
        // "pending" rows mean another worker started generation — skip.
        // "completed" (or NULL legacy) rows mean quizzes are ready — return them.
        if (existing.some(q => q.generationStatus === "pending")) {
            console.info(`[quizGenerator] Generation in progress for affair ${affairId}, skipping.`);
            return [];
        }
        // Real completed quizzes exist — fetch full rows and return
        return db.select().from(quiz).where(eq(quiz.affairId, affairId));
    }

    // ── Layer 3: Insert "pending" sentinel row atomically ──
    // ON CONFLICT DO NOTHING: if a concurrent process already inserted the
    // sentinel between our select and this insert, we silently skip — no error.
    const sentinelId = uuidv4();
    const sentinelRow = {
        id: sentinelId,
        affairId,
        question: "__pending__",      // placeholder — overwritten or deleted
        options: [],
        correctAnswer: null,
        explanation: null,
        generationStatus: "pending",
    };

    // Safe upsert: if another process already created the sentinel, do nothing.
    await db.insert(quiz).values(sentinelRow).onConflictDoNothing();

    // Re-check whether WE actually won the insert (another process may have
    // already inserted a sentinel with a different id).
    const afterSentinel = await db.select({ id: quiz.id, generationStatus: quiz.generationStatus })
        .from(quiz)
        .where(eq(quiz.affairId, affairId));

    const ourSentinel = afterSentinel.find(r => r.id === sentinelId);
    if (!ourSentinel) {
        // We lost the race — another process owns generation. Return empty.
        console.info(`[quizGenerator] Lost sentinel race for affair ${affairId}, skipping.`);
        return [];
    }

    // ── Layer 4: Register in-memory lock, then generate ──
    const generationPromise = _doGenerate(structuredAffairData, sentinelId).finally(() => {
        generationLocks.delete(affairId);
    });
    generationLocks.set(affairId, generationPromise);

    return generationPromise;
};

/**
 * Internal: performs the actual AI call + DB insert.
 * Cleans up the sentinel row on both success and failure.
 * @param {object} structuredAffairData
 * @param {string} sentinelId - The ID of our pending sentinel row
 */
const _doGenerate = async (structuredAffairData, sentinelId) => {
    const affairId = structuredAffairData.id;
    const content = structuredAffairData.structuredContent;

    const prompt = `
You are an expert UPSC question setter. Generate exactly 2 MCQs from the article below.
- Question 1: Factual / Prelims style (tests direct knowledge)
- Question 2: Conceptual / Application-based (tests understanding)

Article:
Title: ${content.title}
Key Points: ${JSON.stringify(content.keyPoints ?? [])}
Prelims Facts: ${JSON.stringify(content.prelimsFacts ?? [])}
Context: ${content.context ?? ""}

Rules:
- Each option must be unique and plausible
- correctAnswer MUST be the EXACT string of one of the 4 options
- explanation MUST be 2–3 sentences explaining WHY the correct answer is right
- Return ONLY a valid JSON array — no markdown, no preamble

Required schema (strict):
[
  {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correctAnswer": "string (exact match of one option)",
    "explanation": "string (2-3 sentences)"
  }
]
`;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const responseText = extractJSON(result.response.text());

        let mcqs;
        try {
            mcqs = JSON.parse(responseText);
        } catch {
            console.error("[quizGenerator] JSON parse failed. Raw output:", responseText.slice(0, 500));
            // Clean up sentinel — generation failed
            await db.delete(quiz).where(eq(quiz.id, sentinelId));
            return [];
        }

        if (!Array.isArray(mcqs) || mcqs.length === 0) {
            console.error("[quizGenerator] AI did not return an array for affair:", affairId);
            await db.delete(quiz).where(eq(quiz.id, sentinelId));
            return [];
        }

        // Validate and sanitize each MCQ before persisting
        const newQuizzes = mcqs
            .filter(q => q.question && Array.isArray(q.options) && q.options.length === 4 && q.correctAnswer)
            .map(q => ({
                id: uuidv4(),
                affairId,
                question: q.question.trim(),
                options: q.options.map(o => o.trim()),
                correctAnswer: q.correctAnswer.trim(),
                // Explanation stored at generation time — never re-derived at submission
                explanation: (q.explanation || "").trim() || "Explanation not available",
                generationStatus: "completed",
            }));

        if (newQuizzes.length === 0) {
            console.error("[quizGenerator] All MCQs failed validation for affair:", affairId);
            await db.delete(quiz).where(eq(quiz.id, sentinelId));
            return [];
        }

        // Delete sentinel, then insert real rows — both ops in sequence.
        // ON CONFLICT DO NOTHING on the real inserts guards against any
        // duplicate that somehow slips through.
        await db.delete(quiz).where(eq(quiz.id, sentinelId));
        await db.insert(quiz).values(newQuizzes).onConflictDoNothing();
        return newQuizzes;

    } catch (error) {
        // Log structured error — do NOT throw, so one failed article doesn't block others
        console.error("[quizGenerator] Generation failed:", {
            affairId,
            message: error.message,
            // Expose 429 rate-limit signals for monitoring
            status: error?.status ?? error?.statusCode ?? "unknown",
        });
        // Always clean up sentinel to allow retry on next cron cycle
        try {
            await db.delete(quiz).where(eq(quiz.id, sentinelId));
        } catch (cleanupErr) {
            console.error("[quizGenerator] Sentinel cleanup failed:", cleanupErr.message);
        }
        return [];
    }
};
