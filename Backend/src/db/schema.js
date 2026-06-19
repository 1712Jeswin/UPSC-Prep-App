import { pgTable, text, timestamp, boolean, integer, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";

// ==========================================
// 1. CORE AUTHENTICATION TABLES (Better Auth Compatible)
// ==========================================

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    role: text("role").default("student").notNull(), // User roles: "student" or "admin"
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }), // Cascaded delete
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }), // Cascaded delete
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"), // Securely stored credentials
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
});

// ==========================================
// 2. DUAL-EDITION CURRENT AFFAIRS & CACHE TABLES
// ==========================================

export const rawNews = pgTable("raw_news", {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    source: text("source").notNull(),
    fetchedAt: timestamp("fetched_at").defaultNow().notNull(), // Automatically swept daily
});

export const articles = pgTable("articles", {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    syllabusTag: text("syllabus_tag"), // GS Paper, E.g. "GS II - Polity"
    prelimsContent: text("prelims_content"),
    mainsContent: text("mains_content"),
    interviewContent: text("interview_content"),
    editionType: text("edition_type").notNull(), // "MORNING" or "EVENING"
    publishedDate: timestamp("published_date").defaultNow().notNull(),
}, (table) => ([
    index("articles_published_date_idx").on(table.publishedDate),
    index("articles_syllabus_tag_idx").on(table.syllabusTag),
    index("articles_edition_type_idx").on(table.editionType),
]));

export const chatSession = pgTable("chat_session", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    articleId: text("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
    messages: text("messages").notNull(), // Stringified JSON array of message objects
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ([
    index("chat_session_user_article_idx").on(table.userId, table.articleId),
]));

// ==========================================
// 3. QUIZ, QUESTION & SUBMISSION TABLES
// ==========================================

export const quizzes = pgTable("quizzes", {
    id: text("id").primaryKey(),
    articleId: text("article_id").references(() => articles.id, { onDelete: "cascade" }), // Nullable for static quizzes
    title: text("title").notNull(),
    passingScore: integer("passing_score").default(3).notNull(),
    totalQuestions: integer("total_questions").default(5).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ([
    index("quizzes_article_id_idx").on(table.articleId),
]));

export const questions = pgTable("questions", {
    id: text("id").primaryKey(),
    quizId: text("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    options: text("options").notNull(), // Stored as a stringified JSON string array
    correctOptionIndex: integer("correct_option_index").notNull(),
    explanation: text("explanation"),
}, (table) => ([
    index("questions_quiz_id_idx").on(table.quizId),
]));

export const submissions = pgTable("submissions", {
    id: text("id").primaryKey(),
    studentId: text("student_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    quizId: text("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
    answers: text("answers").notNull(), // Stringified JSON indices array
    score: integer("score").notNull(),
    passed: boolean("passed").notNull(),
    attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
}, (table) => ([
    index("submissions_student_id_idx").on(table.studentId),
    index("submissions_quiz_id_idx").on(table.quizId),
]));

// ==========================================
// 4. NOTES & STUDY MATERIALS
// ==========================================

export const studyMaterials = pgTable("study_materials", {
    id: text("id").primaryKey(),
    subjectId: text("subject_id").notNull(), // References modules: e.g. "c1", "c2", "g1"
    name: text("name").notNull(),
    publicUrl: text("public_url").notNull(), // Secure S3 URL
    sizeBytes: integer("size_bytes"),
    mimeType: text("mime_type"),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});
