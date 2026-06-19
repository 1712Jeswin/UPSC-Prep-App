import crypto from 'crypto';
import * as adminRepo from './admin.repository.js';
import { AppError } from '../../shared/errors/AppError.js';
import { createModuleLogger, audit } from '../../shared/utils/logger.js';

const log = createModuleLogger('admin');

const SEED_NEWS_POOL = [
  {
    title: 'Supreme Court clarifies Article 145(3) regarding Constitutional Benches',
    source: 'Press Information Bureau (PIB)',
    content: 'The Supreme Court of India recently clarified the scope of Article 145(3) of the Constitution, which mandates that any case involving a substantial question of law as to the interpretation of the Constitution must be heard by a minimum of five judges. The Court emphasized that constitutional benches are crucial for establishing stable legal precedents and ensuring procedural sanctity. Concerns were raised regarding the \'Constitutional Silence\' on the exact timeframe for constituting such benches, which critics argue can delay access to justice. Legal experts suggested that establishing a Permanent Constitution Bench could balance the Chief Justice of India\'s administrative workload, although rotating benches preserve diverse judicial philosophies. This decision touches deeply upon the \'Master of Roster\' doctrine, which designates the Chief Justice of India as the sole administrative authority to allocate cases and constitute benches.',
  },
  {
    title: 'Reserve Bank of India Issues Draft Framework on Climate Risk Disclosures',
    source: 'Reserve Bank of India (RBI)',
    content: 'The RBI released a comprehensive draft framework mandating financial institutions to declare their exposure to climate-related financial risks. The framework emphasizes transparency in governance, strategy, risk management, and metrics regarding green financing. Under General Studies Paper III (Economic Development and Environment), physical risks (floods, heatwaves) and transition risks (carbon tax adjustments) are analyzed. The draft proposes standard reporting templates aligned with international Task Force on Climate-related Financial Disclosures (TCFD) rules, ensuring Indian banks conform to global sustainability standards.',
  },
  {
    title: 'Parliamentary Standing Committee Recommends Reforms in Civil Services Recruitment',
    source: 'Sansad TV',
    content: 'A parliamentary committee has recommended scaling down the UPSC recruitment cycle from 15 months to 9 months to reduce psychological stress on aspirants. The committee emphasized the need for optional subject standardization to ensure parity across disciplines, citing biases in scaling methodologies. The report discusses administrative ethics, lateral entry pros and cons under GS Paper II (Governance and Public Policy), and advises maintaining a neutral, representative civil service while improving structural efficiency through rapid technology integration.',
  },
];

/**
 * Sweeps the database, purging raw news cache (>3 days old) and expired authentication tokens.
 * Implements the automated data lifecycle system (Phase 4).
 */
export const runDatabaseGarbageCollector = async () => {
  log.info('Running database garbage collection sweeper...');

  await adminRepo.purgeStaleRawNews(3);
  await adminRepo.purgeExpiredSessions();
  await adminRepo.purgeExpiredVerifications();

  log.info('Stale data cache swept cleanly.');
  audit.log('DATABASE_GC_COMPLETED');
};

/**
 * Automated Current Affairs & Quiz compilation service (Phase 3).
 * Fetches latest current affairs, processes through Gemini free tier, and caches in Neon DB.
 *
 * @param {string} editionType "MORNING" or "EVENING"
 * @param {boolean} forceDemo Force simulated seed rotation
 */
export const syncDailyNewsAndQuizzes = async (editionType = 'MORNING', forceDemo = false) => {
  const isDemo = forceDemo || process.env.DEMO_INGEST_MODE === 'true';

  // 1. Run database sweep first to prevent memory/storage leaks
  await runDatabaseGarbageCollector();

  // Define the batch size (UPSC aspirants require coverage across multiple GS papers)
  const batchSize = 3;
  const syncResults = [];

  log.info({ batchSize }, 'Initiating daily current affairs ingestion');

  for (let i = 0; i < batchSize; i++) {
    let newsText = '';
    let sourceLabel = 'Ingestion Engine';

    if (isDemo) {
      // In Demo mode, compile distinct seed articles from the pool
      const selectedSeed = SEED_NEWS_POOL[i % SEED_NEWS_POOL.length];
      newsText = selectedSeed.content;
      sourceLabel = selectedSeed.source;
      log.info({ slot: i + 1, title: selectedSeed.title }, 'Processing demo pool article');
    } else {
      // Production Mode: Fetch raw news feed buffers offset by i
      const rawBuffer = await adminRepo.fetchRawNewsBuffer(1, i);
      if (rawBuffer.length > 0) {
        newsText = rawBuffer[0].content;
        sourceLabel = rawBuffer[0].source;
        log.info({ slot: i + 1, title: rawBuffer[0].title }, 'Processing database raw news buffer');
      } else {
        const fallbackSeed = SEED_NEWS_POOL[i % SEED_NEWS_POOL.length];
        newsText = fallbackSeed.content;
        sourceLabel = fallbackSeed.source;
        log.info({ slot: i + 1, title: fallbackSeed.title }, 'Buffer empty, using fallback seed');
      }
    }

    // Query Google Gemini 2.5 Flash API free tier using standard fetch
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new AppError(500, 'Missing GEMINI_API_KEY environment configuration.', 'CONFIG_ERROR');
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

    log.info({ slot: i + 1 }, 'Requesting Gemini API structured news compilation');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      log.error({ slot: i + 1, status: response.status, errorText }, 'Gemini API ingestion failed');
      continue; // Skip failed slot and proceed with remaining batch items
    }

    const resultJson = await response.json();
    const parsedText = resultJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!parsedText) {
      log.warn({ slot: i + 1 }, 'Empty response received from Gemini API');
      continue;
    }

    const aiDigest = JSON.parse(parsedText);

    // Save compiled article and quiz in Neon DB
    const articleId = crypto.randomUUID();
    const quizId = crypto.randomUUID();

    // Create article
    const newArticle = await adminRepo.insertArticle({
      id: articleId,
      title: aiDigest.title || 'Daily Current Affairs Digest',
      summary: aiDigest.summary || 'Summary unavailable',
      syllabusTag: aiDigest.syllabusTag || 'Current Affairs',
      prelimsContent: aiDigest.examFocus || 'Factual details coming soon.',
      mainsContent: null,
      interviewContent: null,
      editionType: editionType,
      publishedDate: new Date(),
    });

    // Create quiz
    const newQuiz = await adminRepo.insertQuiz({
      id: quizId,
      articleId: articleId,
      title: aiDigest.quiz?.title || 'Daily Recall Quiz',
      passingScore: aiDigest.quiz?.passingScore || 3,
      totalQuestions: aiDigest.quiz?.questions?.length || 5,
      createdAt: new Date(),
    });

    // Create quiz questions
    const quizQuestions = aiDigest.quiz?.questions || [];
    for (const q of quizQuestions) {
      await adminRepo.insertQuestion({
        id: crypto.randomUUID(),
        quizId: quizId,
        text: q.text,
        options: JSON.stringify(q.options),
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation || 'No explanation provided.',
      });
    }

    log.info({ slot: i + 1, title: newArticle.title, tag: newArticle.syllabusTag }, 'Article compiled and published');
    audit.log('ARTICLE_CREATED', { articleId, quizId, editionType });

    syncResults.push({
      article: newArticle,
      quiz: newQuiz,
      questionsCount: quizQuestions.length,
    });
  }

  log.info({ publishedCount: syncResults.length }, 'Batch ingestion complete');

  return {
    success: true,
    batchSize: syncResults.length,
    articles: syncResults.map((r) => r.article),
  };
};
