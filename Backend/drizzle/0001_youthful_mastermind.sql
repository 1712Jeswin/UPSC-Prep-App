ALTER TABLE "questions" ALTER COLUMN "options" SET DATA TYPE jsonb;--> statement-breakpoint
CREATE INDEX "articles_published_date_idx" ON "articles" USING btree ("published_date");--> statement-breakpoint
CREATE INDEX "articles_syllabus_tag_idx" ON "articles" USING btree ("syllabus_tag");--> statement-breakpoint
CREATE INDEX "articles_edition_type_idx" ON "articles" USING btree ("edition_type");--> statement-breakpoint
CREATE INDEX "chat_session_user_article_idx" ON "chat_session" USING btree ("user_id","article_id");--> statement-breakpoint
CREATE INDEX "questions_quiz_id_idx" ON "questions" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "quizzes_article_id_idx" ON "quizzes" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "submissions_student_id_idx" ON "submissions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "submissions_quiz_id_idx" ON "submissions" USING btree ("quiz_id");