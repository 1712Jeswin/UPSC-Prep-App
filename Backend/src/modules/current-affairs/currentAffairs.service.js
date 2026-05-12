import Parser from "rss-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db/index.js";
import { article, mcq } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";

const parser = new Parser();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const KEYWORDS = ["policy", "scheme", "bill", "report", "India", "UN", "economy", "environment"];

export const fetchRSSArticles = async () => {
  const feed = await parser.parseURL("https://www.thehindu.com/news/national/feeder/default.rss");
  return feed.items.map((item) => ({
    title: item.title,
    content: item.contentSnippet || item.content || item.summary,
    link: item.link,
    pubDate: item.pubDate,
  }));
};

export const filterRelevantArticles = (articles) => {
  return articles
    .filter((a) => KEYWORDS.some((kw) => a.title?.toLowerCase().includes(kw.toLowerCase()) || a.content?.toLowerCase().includes(kw.toLowerCase())))
    .slice(0, 5); // top 5
};

export const prepareBatchInput = (articles) => {
  return articles
    .map((a, i) => `Article ${i + 1}:\nTitle: ${a.title}\nLink: ${a.link}\nDate: ${a.pubDate}\nSummary: ${(a.content || "").substring(0, 500)}\n`)
    .join("\n---\n");
};

export const generateFromAI = async (batchText) => {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const prompt = `
  You are an expert UPSC exam analyst. Process the following batch of news articles.
  Return a strict JSON array containing exactly one JSON object per article.
  Each object MUST match this structure:
  {
    "title": "Clear headline",
    "category": "GS II • POLITY or GS III • ECONOMY etc",
    "source_link": "Must be the exact link provided in the input",
    "published_date": "Original pubDate",
    "why_in_news": "Short sentence on context",
    "background": "Historical or factual context",
    "key_points": ["point 1", "point 2"],
    "prelims_facts": ["fact 1", "fact 2"],
    "mains_angle": "How this applies to subjective questions",
    "mcqs": [
      {
        "question": "A prelims style question",
        "options": ["A", "B", "C", "D"],
        "answer": "The correct option text"
      }
    ]
  }

  Here are the articles:
  ${batchText}
  
  Return ONLY the JSON array, no markdown wrappers like \`\`\`json.
  `;

  const result = await model.generateContent(prompt);
  let responseText = result.response.text().trim();
  
  // Clean up any markdown json blocks if present
  if (responseText.startsWith('\`\`\`json')) {
      responseText = responseText.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
  } else if (responseText.startsWith('\`\`\`')) {
      responseText = responseText.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
  }

  return JSON.parse(responseText);
};

export const saveToDB = async (processedArticles) => {
  for (const item of processedArticles) {
    const articleId = uuidv4();
    
    try {
      await db.insert(article).values({
        id: articleId,
        title: item.title,
        category: item.category,
        sourceLink: item.source_link,
        publishedDate: item.published_date ? new Date(item.published_date) : new Date(),
        whyInNews: item.why_in_news,
        background: item.background,
        keyPoints: JSON.stringify(item.key_points || []),
        prelimsFacts: JSON.stringify(item.prelims_facts || []),
        mainsAngle: item.mains_angle,
        sourceName: "PIB",
      }).onConflictDoNothing({ target: [article.sourceLink, article.publishedDate] });

      // If it was inserted (or if we want to add MCQs anyway)
      // Since ON CONFLICT DO NOTHING doesn't return the inserted id easily without RETURNING, 
      // we can do a select to get the actual ID if it existed, or just proceed if we assume new
      
      const existingArticle = await db.select({ id: article.id })
                                    .from(article)
                                    .where(eq(article.sourceLink, item.source_link))
                                    .limit(1);

      const actualArticleId = existingArticle.length > 0 ? existingArticle[0].id : articleId;

      if (item.mcqs && existingArticle.length === 0) { // Only add MCQs if article is new
         const mcqValues = item.mcqs.map((m) => ({
            id: uuidv4(),
            articleId: actualArticleId,
            question: m.question,
            options: JSON.stringify(m.options || []),
            answer: m.answer,
         }));
         if (mcqValues.length > 0) {
             await db.insert(mcq).values(mcqValues);
         }
      }
    } catch (error) {
      console.error("Error saving article:", error.message);
    }
  }
};

export const generateDailyContent = async () => {
  const articles = await fetchRSSArticles();
  const relevant = filterRelevantArticles(articles);
  if (relevant.length === 0) return { message: "No relevant articles found today." };

  const batchText = prepareBatchInput(relevant);
  const aiResults = await generateFromAI(batchText);
  
  await saveToDB(aiResults);
  return { message: "Daily content generated successfully.", count: aiResults.length };
};

export const getDailyArticles = async () => {
  return await db.select().from(article).orderBy(desc(article.createdAt)).limit(10);
};

export const getArticleById = async (id) => {
  const results = await db.select().from(article).where(eq(article.id, id)).limit(1);
  return results[0] || null;
};

export const getMCQsByArticleId = async (id) => {
  return await db.select().from(mcq).where(eq(mcq.articleId, id));
};
