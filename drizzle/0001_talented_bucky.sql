ALTER TABLE "schedule_entries" DROP CONSTRAINT "monday_week_start";--> statement-breakpoint
DROP INDEX "schedule_class_week";--> statement-breakpoint
DROP INDEX "schedule_week";--> statement-breakpoint
DROP INDEX "schedule_slot_unique";--> statement-breakpoint
DELETE FROM "schedule_entries" AS "entry"
USING (
	SELECT "class_id", MAX("week_start") AS "week_start"
	FROM "schedule_entries"
	GROUP BY "class_id"
) AS "latest"
WHERE "entry"."class_id" = "latest"."class_id"
	AND "entry"."week_start" <> "latest"."week_start";--> statement-breakpoint
CREATE INDEX "schedule_class" ON "schedule_entries" USING btree ("class_id");--> statement-breakpoint
CREATE UNIQUE INDEX "schedule_slot_unique" ON "schedule_entries" USING btree ("class_id","day_of_week","lesson_number");--> statement-breakpoint
ALTER TABLE "schedule_entries" DROP COLUMN "week_start";
