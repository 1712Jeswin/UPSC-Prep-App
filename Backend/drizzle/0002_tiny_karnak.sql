CREATE TABLE "daily_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" text NOT NULL,
	"total_affairs" integer DEFAULT 0,
	"completed_count" integer DEFAULT 0,
	"quiz_unlocked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "daily_session_user_id_date_unique" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "quiz" (
	"id" text PRIMARY KEY NOT NULL,
	"affair_id" text NOT NULL,
	"question" text NOT NULL,
	"options" json,
	"correct_answer" text,
	"explanation" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "structured_affair" (
	"id" text PRIMARY KEY NOT NULL,
	"raw_article_id" text NOT NULL,
	"structured_content" jsonb,
	"category" text,
	"difficulty" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"affair_id" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	CONSTRAINT "user_progress_user_id_affair_id_unique" UNIQUE("user_id","affair_id")
);
--> statement-breakpoint
CREATE TABLE "user_quiz_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"quiz_id" text NOT NULL,
	"selected_answer" text,
	"is_correct" boolean,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_quiz_attempt_user_id_quiz_id_unique" UNIQUE("user_id","quiz_id")
);
--> statement-breakpoint
ALTER TABLE "daily_session" ADD CONSTRAINT "daily_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_affair_id_structured_affair_id_fk" FOREIGN KEY ("affair_id") REFERENCES "public"."structured_affair"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "structured_affair" ADD CONSTRAINT "structured_affair_raw_article_id_article_id_fk" FOREIGN KEY ("raw_article_id") REFERENCES "public"."article"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_affair_id_structured_affair_id_fk" FOREIGN KEY ("affair_id") REFERENCES "public"."structured_affair"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quiz_attempt" ADD CONSTRAINT "user_quiz_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quiz_attempt" ADD CONSTRAINT "user_quiz_attempt_quiz_id_quiz_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quiz"("id") ON DELETE no action ON UPDATE no action;