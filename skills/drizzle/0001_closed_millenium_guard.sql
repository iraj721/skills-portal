ALTER TABLE "courses" ALTER COLUMN "instructor_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "thumbnail_url" text;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "thumbnail_url" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assignments_course_idx" ON "assignments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "certificates_student_idx" ON "certificates" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "certificates_course_idx" ON "certificates" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "courses_status_idx" ON "courses" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "courses_instructor_idx" ON "courses" USING btree ("instructor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "courses_category_idx" ON "courses" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "courses_slug_idx" ON "courses" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrollments_student_idx" ON "enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrollments_course_idx" ON "enrollments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrollments_batch_idx" ON "enrollments" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrollments_status_idx" ON "enrollments" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "instructor_profiles_user_idx" ON "instructor_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "instructor_profiles_org_idx" ON "instructor_profiles" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lessons_module_idx" ON "lessons" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "modules_course_idx" ON "modules" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organizations_status_idx" ON "organizations" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "progress_student_idx" ON "progress" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "progress_lesson_idx" ON "progress" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submissions_assignment_idx" ON "submissions" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submissions_student_idx" ON "submissions" USING btree ("student_id");