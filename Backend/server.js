import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./src/modules/auth/auth.routes.js";
import adminRoutes from "./src/modules/admin/admin.routes.js";
import { auth } from "./src/lib/auth.js";
import { toNodeHandler } from "better-auth/node";

import { db } from "./src/db/index.js";
import { user } from "./src/db/schema.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Simple CORS as requested
app.use(express.json());

// Custom Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// Current Affairs Endpoints for Aspirants (Neon DB query)
app.get("/api/articles", async (req, res) => {
  try {
    // Import articles model dynamically to avoid early initialization conflicts
    const { articles } = await import("./src/db/schema.js");
    const { desc } = await import("drizzle-orm");
    const list = await db.select().from(articles).orderBy(desc(articles.publishedDate)).limit(10);
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/articles/:id", async (req, res) => {
  try {
    const { articles } = await import("./src/db/schema.js");
    const { eq } = await import("drizzle-orm");
    const detail = await db.select().from(articles).where(eq(articles.id, req.params.id)).limit(1);
    if (detail.length === 0) return res.status(404).json({ success: false, message: "Article not found" });
    res.json({ success: true, data: detail[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET Quiz associated with a specific article (Securely strips answers to prevent client cheating inspection)
app.get("/api/articles/:articleId/quiz", async (req, res) => {
  try {
    const { quizzes, questions } = await import("./src/db/schema.js");
    const { eq } = await import("drizzle-orm");

    const quizList = await db.select().from(quizzes).where(eq(quizzes.articleId, req.params.articleId)).limit(1);
    if (quizList.length === 0) {
      return res.status(404).json({ success: false, message: "Quiz not found for this article" });
    }
    
    const quiz = quizList[0];
    const questionList = await db.select().from(questions).where(eq(questions.quizId, quiz.id));

    // Map and strip correct index and descriptions to enforce testing integrity
    const cleanQuestions = questionList.map(q => ({
      id: q.id,
      quizId: q.quizId,
      text: q.text,
      options: JSON.parse(q.options),
    }));

    res.json({
      success: true,
      data: {
        quizId: quiz.id,
        title: quiz.title,
        passingScore: quiz.passingScore,
        totalQuestions: quiz.totalQuestions,
        questions: cleanQuestions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST Quiz submission and obtain instant server-side grading & review justifications
app.post("/api/quizzes/:quizId/submit", async (req, res) => {
  try {
    const { quizzes, questions, submissions } = await import("./src/db/schema.js");
    const { eq } = await import("drizzle-orm");
    const crypto = await import("crypto");

    const { answers, studentId } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: "Answers must be a valid array" });
    }

    const quizList = await db.select().from(quizzes).where(eq(quizzes.id, req.params.quizId)).limit(1);
    if (quizList.length === 0) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }
    const quiz = quizList[0];

    const questionList = await db.select().from(questions).where(eq(questions.quizId, quiz.id));

    let score = 0;
    const evaluationResults = questionList.map((q, idx) => {
      const selectedIndex = answers[idx] !== undefined ? answers[idx] : -1;
      const isCorrect = selectedIndex === q.correctOptionIndex;
      if (isCorrect) score++;

      return {
        questionId: q.id,
        text: q.text,
        options: JSON.parse(q.options),
        correctOptionIndex: q.correctOptionIndex,
        selectedOptionIndex: selectedIndex,
        isCorrect,
        explanation: q.explanation || "No explanation provided."
      };
    });

    const passed = score >= quiz.passingScore;

    // Persist session submission inside Postgres if user is authenticated
    if (studentId) {
      await db.insert(submissions).values({
        id: crypto.randomUUID(),
        studentId,
        quizId: quiz.id,
        answers: JSON.stringify(answers),
        score,
        passed,
        attemptedAt: new Date()
      });
    }

    res.json({
      success: true,
      data: {
        score,
        passed,
        totalQuestions: quiz.totalQuestions,
        passingScore: quiz.passingScore,
        results: evaluationResults
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Better Auth handler (Standard Express 5 mount without wildcard)
app.use("/api/auth", toNodeHandler(auth));

// Test route (Drizzle check)
app.get("/db-check", async (req, res) => {
  try {
    const allUsers = await db.select().from(user);
    res.json({ success: true, count: allUsers.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "UPSC Platform API is running 🚀"
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: []
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});