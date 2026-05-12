CREATE TABLE "article" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text,
	"source_link" text,
	"published_date" timestamp,
	"why_in_news" text,
	"background" text,
	"key_points" text,
	"prelims_facts" text,
	"mains_angle" text,
	"source_name" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "article_source_link_published_date_unique" UNIQUE("source_link","published_date")
);
--> statement-breakpoint
CREATE TABLE "mcq" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text,
	"question" text NOT NULL,
	"options" text,
	"answer" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "mcq" ADD CONSTRAINT "mcq_article_id_article_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."article"("id") ON DELETE no action ON UPDATE no action;