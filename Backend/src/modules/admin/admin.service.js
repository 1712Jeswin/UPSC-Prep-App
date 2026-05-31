import { db } from "../../db/index.js";
import { articles, quizzes, questions, rawNews, session, verification } from "../../db/schema.js";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

const SEED_NEWS_POOL = [
  {
    title: "Supreme Court clarifies Article 145(3) regarding Constitutional Benches",
    source: "Press Information Bureau (PIB)",
    content: "The Supreme Court of India recently clarified the scope of Article 145(3) of the Constitution, which mandates that any case involving a substantial question of law as to the interpretation of the Constitution must be heard by a minimum of five judges. The Court emphasized that constitutional benches are crucial for establishing stable legal precedents and ensuring procedural sanctity. Concerns were raised regarding the 'Constitutional Silence' on the exact timeframe for constituting such benches, which critics argue can delay access to justice. Legal experts suggested that establishing a Permanent Constitution Bench could balance the Chief Justice of India's administrative workload, although rotating benches preserve diverse judicial philosophies. This decision touches deeply upon the 'Master of Roster' doctrine, which designates the Chief Justice of India as the sole administrative authority to allocate cases and constitute benches."
  },
  {
    title: "Reserve Bank of India Issues Draft Framework on Climate Risk Disclosures",
    source: "Reserve Bank of India (RBI)",
    content: "The RBI released a comprehensive draft framework mandating financial institutions to declare their exposure to climate-related financial risks. The framework emphasizes transparency in governance, strategy, risk management, and metrics regarding green financing. Under General Studies Paper III (Economic Development and Environment), physical risks (floods, heatwaves) and transition risks (carbon tax adjustments) are analyzed. The draft proposes standard reporting templates aligned with international Task Force on Climate-related Financial Disclosures (TCFD) rules, ensuring Indian banks conform to global sustainability standards."
  },
  {
    title: "Parliamentary Standing Committee Recommends Reforms in Civil Services Recruitment",
    source: "Sansad TV",
    content: "A parliamentary committee has recommended scaling down the UPSC recruitment cycle from 15 months to 9 months to reduce psychological stress on aspirants. The committee emphasized the need for optional subject standardization to ensure parity across disciplines, citing biases in scaling methodologies. The report discusses administrative ethics, lateral entry pros and cons under GS Paper II (Governance and Public Policy), and advises maintaining a neutral, representative civil service while improving structural efficiency through rapid technology integration."
  }
];

/**
 * Sweeps the database, purging raw news cache (>3 days old) and expired authentication tokens.
 * Implements the automated data lifecycle system (Phase 4).
 */
export const runDatabaseGarbageCollector = async () => {
  console.log("[GC] Running database garbage collection sweeper...");
  try {
    // 1. Purge raw news buffer older than 3 days
    const prunedNews = await db.execute(
      sql`DELETE FROM ${rawNews} WHERE ${rawNews.fetchedAt} < NOW() - INTERVAL '3 days'`
    );

    // 2. Purge expired Better Auth sessions
    const prunedSessions = await db.execute(
      sql`DELETE FROM ${session} WHERE ${session.expiresAt} < NOW()`
    );

    // 3. Purge expired Better Auth verifications
    const prunedVerifications = await db.execute(
      sql`DELETE FROM ${verification} WHERE ${verification.expiresAt} < NOW()`
    );

    console.log("[GC] Stale data cache swept cleanly.");
  } catch (error) {
    console.error("[GC Error] Database sweep failed:", error);
  }
};

/**
 * Automated Current Affairs & Quiz compilation service (Phase 3).
 * Fetches latest current affairs, processes through Gemini free tier, and caches in Neon DB.
 * 
 * @param {string} editionType "MORNING" or "EVENING"
 * @param {boolean} forceDemo Force simulated seed rotation
 */
export const syncDailyNewsAndQuizzes = async (editionType = "MORNING", forceDemo = false) => {
  const isDemo = forceDemo || process.env.DEMO_INGEST_MODE === "true";
  
  // 1. Run database sweep first to prevent memory/storage leaks
  await runDatabaseGarbageCollector();

  // Define the batch size (UPSC aspirants require coverage across multiple GS papers)
  const batchSize = 3;
  const syncResults = [];

  console.log(`[Batch Ingest] Initiating daily current affairs ingestion. Target batch size: ${batchSize}`);

  for (let i = 0; i < batchSize; i++) {
    let newsText = "";
    let sourceLabel = "Ingestion Engine";

    if (isDemo) {
      // In Demo mode, compile distinct seed articles from the pool
      const selectedSeed = SEED_NEWS_POOL[i % SEED_NEWS_POOL.length];
      newsText = selectedSeed.content;
      sourceLabel = selectedSeed.source;
      console.log(`[Demo Ingest Slot ${i + 1}] Processing pool article: "${selectedSeed.title}"`);
    } else {
      // Production Mode: Fetch raw news feed buffers offset by i, or fallback to SEED_NEWS_POOL for any remaining slots
      const rawBuffer = await db.select().from(rawNews).limit(1).offset(i);
      if (rawBuffer.length > 0) {
        newsText = rawBuffer[0].content;
        sourceLabel = rawBuffer[0].source;
        console.log(`[Prod Ingest Slot ${i + 1}] Processing database raw news buffer entry: "${rawBuffer[0].title}"`);
      } else {
        const fallbackSeed = SEED_NEWS_POOL[i % SEED_NEWS_POOL.length];
        newsText = fallbackSeed.content;
        sourceLabel = fallbackSeed.source;
        console.log(`[Prod Ingest Slot ${i + 1} - Fallback] Buffer empty. Processing default seed: "${fallbackSeed.title}"`);
      }
    }

    // Query Google Gemini 2.5 Flash API free tier using standard fetch
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error("Missing GEMINI_API_KEY environment configuration.");
    }

    const promptText = `
You are an expert UPSC Civil Services Examination instructor and curriculum designer. 
Analyze the following raw current affairs and news text:
"${newsText}"

Provide a highly-concentrated, high-yield structured UPSC exam analysis in JSON format. The JSON schema must strictly match the following keys:
{
  "title": "A concise, academic headline for the current affairs topic",
  "summary": "A crisp, beginner-friendly 2-sentence context explaining 'Why in News' and what occurred.",
  "syllabusTag": "Specific General Studies Paper category: Specify exactly one prefix: 'GS I - Heritage & Geography', 'GS II - Polity & Governance', or 'GS III - Economy & Tech'",
  "examFocus": "A unified, scannable bulleted list focusing strictly on direct exam-relevant material. Combine the core Prelims facts (constitutions, articles, facts) and the central Mains argument/debate (pros/cons) in a single compact set of high-yield bullet points.",
  "quiz": {
    "title": "Today's Daily Current Affairs Recall Quiz",
    "passingScore": 3,
    "questions": [
      {
        "text": "The clear MCQ question text focusing on details in the news...",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctOptionIndex": 0,
        "explanation": "A complete, detailed explanation of why the correct option is right and other options are wrong, citing details from the text."
      }
    ]
  }
}
Generate exactly 5 questions for the quiz array. The options must be distinct and challenging, simulating the actual UPSC Prelims standard.
`;

    console.log(`[Gemini API - Slot ${i + 1}] Requesting structured news compilation...`);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Gemini API Error - Slot ${i + 1}] Ingestion failed: ${response.status}`, errorText);
      continue; // Skip failed slot and proceed with remaining batch items
    }

    const resultJson = await response.json();
    const parsedText = resultJson.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!parsedText) {
      console.warn(`[Gemini API Warning - Slot ${i + 1}] Empty response received.`);
      continue;
    }

    const aiDigest = JSON.parse(parsedText);

    // Save compiled article and quiz in Neon DB as a clean transaction
    const articleId = crypto.randomUUID();
    const quizId = crypto.randomUUID();

    // Create article (Backward Compatible mapping: store unified examFocus in prelimsContent, other parts empty)
    const [newArticle] = await db.insert(articles).values({
      id: articleId,
      title: aiDigest.title || "Daily Current Affairs Digest",
      summary: aiDigest.summary || "Summary unavailable",
      syllabusTag: aiDigest.syllabusTag || "Current Affairs",
      prelimsContent: aiDigest.examFocus || "Factual details coming soon.",
      mainsContent: null,
      interviewContent: null,
      editionType: editionType,
      publishedDate: new Date()
    }).returning();

    // Create quiz
    const [newQuiz] = await db.insert(quizzes).values({
      id: quizId,
      articleId: articleId,
      title: aiDigest.quiz?.title || "Daily Recall Quiz",
      passingScore: aiDigest.quiz?.passingScore || 3,
      totalQuestions: aiDigest.quiz?.questions?.length || 5,
      createdAt: new Date()
    }).returning();

    // Create quiz questions
    const quizQuestions = aiDigest.quiz?.questions || [];
    for (const q of quizQuestions) {
      await db.insert(questions).values({
        id: crypto.randomUUID(),
        quizId: quizId,
        text: q.text,
        options: JSON.stringify(q.options),
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation || "No explanation provided."
      });
    }

    console.log(`[Ingest Success - Slot ${i + 1}] Compiled: "${newArticle.title}" [${newArticle.syllabusTag}]`);
    
    syncResults.push({
      article: newArticle,
      quiz: newQuiz,
      questionsCount: quizQuestions.length
    });
  }

  console.log(`[Batch Ingest Complete] Published ${syncResults.length} articles inside Neon PostgreSQL.`);

  return {
    success: true,
    batchSize: syncResults.length,
    articles: syncResults.map(r => r.article)
  };
};
