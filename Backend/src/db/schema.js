import { pgTable, text, timestamp, boolean, unique } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
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
    userId: text("user_id").notNull().references(() => user.id),
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => user.id),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
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

export const article = pgTable("article", {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    category: text("category"),
    sourceLink: text("source_link"),
    publishedDate: timestamp("published_date"),
    whyInNews: text("why_in_news"),
    background: text("background"),
    keyPoints: text("key_points"), // JSON string
    prelimsFacts: text("prelims_facts"), // JSON string
    mainsAngle: text("mains_angle"),
    sourceName: text("source_name"),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
    uniqueSourceDate: unique().on(table.sourceLink, table.publishedDate)
}));

export const mcq = pgTable("mcq", {
    id: text("id").primaryKey(),
    articleId: text("article_id").references(() => article.id),
    question: text("question").notNull(),
    options: text("options"), // JSON string
    answer: text("answer"),
    createdAt: timestamp("created_at").defaultNow(),
});
