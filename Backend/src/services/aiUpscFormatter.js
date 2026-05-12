import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/index.js";
import { structuredAffair } from "../db/schemaV2.js";
import { eq } from "drizzle-orm";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * In-memory formatting lock: rawArticleId → Promise<structuredAffair>
 *
 * WHY: Same pattern as quizGenerator — prevents concurrent requests for the
 * same article from both passing the "does structured affair exist?" check
 * before either has committed anything. The DB UNIQUE constraint on
 * raw_article_id is the hard backstop; this lock avoids wasted AI calls.
 */
const formattingLocks = new Map(); // Map<rawArticleId, Promise<structuredAffair>>

export const formatArticleForUpsc = async (rawArticle) => {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");

    // ── DB check first (fast path, handles cross-restart idempotency) ──
    const existing = await db
        .select()
        .from(structuredAffair)
        .where(eq(structuredAffair.rawArticleId, rawArticle.id))
        .limit(1);

    if (existing.length > 0) return existing[0];

    // ── In-memory lock: return same Promise if already in-flight ──
    if (formattingLocks.has(rawArticle.id)) {
        return formattingLocks.get(rawArticle.id);
    }

    const formatPromise = _doFormat(rawArticle).finally(() => {
        formattingLocks.delete(rawArticle.id);
    });
    formattingLocks.set(rawArticle.id, formatPromise);

    return formatPromise;
};

const _doFormat = async (rawArticle) => {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    You are an expert UPSC exam analyst. Process the following news article.
    Return a strict JSON object with EXACTLY this structure:
    {
      "title": "Clear headline",
      "category": "Polity | Economy | Environment | IR | Sci-Tech | Art & Culture",
      "context": "Brief summary of what happened",
      "whyInNews": "Short sentence on context",
      "keyPoints": ["point 1", "point 2", "point 3"],
      "prelimsFacts": ["fact 1", "fact 2"],
      "mainsInsight": "How this applies to subjective questions",
      "difficulty": "Easy | Medium | Hard"
    }

    Article details:
    Title: ${rawArticle.title}
    Summary: ${rawArticle.whyInNews || rawArticle.title}
    Background: ${rawArticle.background || ''}
    Points: ${rawArticle.keyPoints || ''}
    
    Return ONLY the JSON object, no markdown wrappers like \`\`\`json.
    `;

    try {
        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();

        if (responseText.startsWith('```json')) {
            responseText = responseText.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (responseText.startsWith('```')) {
            responseText = responseText.replace(/^```/, '').replace(/```$/, '').trim();
        }

        const structuredContent = JSON.parse(responseText);
        const newStructuredAffair = {
            id: uuidv4(),
            rawArticleId: rawArticle.id,
            structuredContent,
            category: structuredContent.category,
            difficulty: structuredContent.difficulty,
        };

        // ON CONFLICT DO NOTHING: if another process beat us to the insert
        // (possible in multi-worker deployments), silently skip — no error.
        // Then re-fetch to return the canonical row.
        await db.insert(structuredAffair).values(newStructuredAffair).onConflictDoNothing();

        // Re-fetch to guarantee we return the actually-committed row
        // (may differ from newStructuredAffair if we lost the insert race)
        const committed = await db
            .select()
            .from(structuredAffair)
            .where(eq(structuredAffair.rawArticleId, rawArticle.id))
            .limit(1);

        return committed[0] ?? newStructuredAffair;

    } catch (error) {
        console.error("AI Formatting error:", error.message);

        const fallback = {
            id: uuidv4(),
            rawArticleId: rawArticle.id,
            structuredContent: {
                title: rawArticle.title,
                category: rawArticle.category || "General",
                context: rawArticle.whyInNews || "No context provided",
                whyInNews: rawArticle.whyInNews || "",
                keyPoints: rawArticle.keyPoints ? JSON.parse(rawArticle.keyPoints) : [],
                prelimsFacts: rawArticle.prelimsFacts ? JSON.parse(rawArticle.prelimsFacts) : [],
                mainsInsight: rawArticle.mainsAngle || "",
                difficulty: "Medium"
            },
            category: rawArticle.category || "General",
            difficulty: "Medium"
        };

        // Same pattern: ON CONFLICT DO NOTHING prevents duplicate constraint errors
        // even on the fallback path.
        await db.insert(structuredAffair).values(fallback).onConflictDoNothing();

        const committed = await db
            .select()
            .from(structuredAffair)
            .where(eq(structuredAffair.rawArticleId, rawArticle.id))
            .limit(1);

        return committed[0] ?? fallback;
    }
};
