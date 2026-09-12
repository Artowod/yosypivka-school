CREATE TYPE "public"."day_of_week" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');--> statement-breakpoint
CREATE TYPE "public"."gallery_id" AS ENUM('school', 'class_1', 'class_2', 'class_3', 'class_4');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'class_1', 'class_2', 'class_3', 'class_4');--> statement-breakpoint
CREATE TABLE "asset_cleanup_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "asset_cleanup_jobs_publicId_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid,
	"user_email" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"class_id" integer,
	"summary" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" integer PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "classes_slug_unique" UNIQUE("slug"),
	CONSTRAINT "four_classes" CHECK ("classes"."id" between 1 and 4)
);
--> statement-breakpoint
CREATE TABLE "error_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid,
	"user_email" text,
	"location" text NOT NULL,
	"error_code" text,
	"message" text NOT NULL,
	"context" jsonb,
	"request_id" text
);
--> statement-breakpoint
CREATE TABLE "lesson_slots" (
	"lesson_number" integer PRIMARY KEY NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	CONSTRAINT "six_lesson_slots" CHECK ("lesson_slots"."lesson_number" between 1 and 6)
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creation_date" date NOT NULL,
	"file_name" text NOT NULL,
	"cloudinary_public_id" text NOT NULL,
	"secure_url" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"gallery_id" "gallery_id" NOT NULL,
	"class_id" integer,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"width" integer,
	"height" integer,
	"format" text,
	"bytes" integer,
	CONSTRAINT "photos_cloudinaryPublicId_unique" UNIQUE("cloudinary_public_id"),
	CONSTRAINT "photo_gallery_class" CHECK (("photos"."gallery_id" = 'school' AND "photos"."class_id" IS NULL) OR ("photos"."class_id" IS NOT NULL AND "photos"."gallery_id"::text = 'class_' || "photos"."class_id"::text))
);
--> statement-breakpoint
CREATE TABLE "schedule_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" integer NOT NULL,
	"week_start" date NOT NULL,
	"day_of_week" "day_of_week" NOT NULL,
	"lesson_number" integer NOT NULL,
	"subject" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	CONSTRAINT "monday_week_start" CHECK (extract(isodow from "schedule_entries"."week_start") = 1)
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "role" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"surname" text,
	"signin_date" timestamp with time zone,
	"last_signin_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_entries" ADD CONSTRAINT "schedule_entries_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_entries" ADD CONSTRAINT "schedule_entries_lesson_number_lesson_slots_lesson_number_fk" FOREIGN KEY ("lesson_number") REFERENCES "public"."lesson_slots"("lesson_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_entries" ADD CONSTRAINT "schedule_entries_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "photos_gallery_date" ON "photos" USING btree ("gallery_id","creation_date","id");--> statement-breakpoint
CREATE INDEX "photos_class_date" ON "photos" USING btree ("class_id","creation_date");--> statement-breakpoint
CREATE INDEX "photos_date" ON "photos" USING btree ("creation_date","id");--> statement-breakpoint
CREATE UNIQUE INDEX "schedule_slot_unique" ON "schedule_entries" USING btree ("class_id","week_start","day_of_week","lesson_number");--> statement-breakpoint
CREATE INDEX "schedule_class_week" ON "schedule_entries" USING btree ("class_id","week_start");--> statement-breakpoint
CREATE INDEX "schedule_week" ON "schedule_entries" USING btree ("week_start");--> statement-breakpoint
CREATE UNIQUE INDEX "user_role_unique" ON "user_roles" USING btree ("user_id","role");