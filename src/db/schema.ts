import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  date,
  time,
  uniqueIndex,
  index,
  check,
  jsonb,
} from "drizzle-orm/pg-core";
import { DAYS, GALLERIES, ROLES } from "../lib/constants";
export const roleEnum = pgEnum("role", ROLES);
export const dayEnum = pgEnum("day_of_week", DAYS);
export const galleryEnum = pgEnum("gallery_id", GALLERIES);
const timestamps = {
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
};
export const users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey(),
  email: text().notNull().unique(),
  name: text(),
  surname: text(),
  signinDate: timestamp({ withTimezone: true }),
  lastSigninDate: timestamp({ withTimezone: true }),
  ...timestamps,
});
export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: roleEnum().notNull(),
  },
  (t) => [uniqueIndex("user_role_unique").on(t.userId, t.role)],
);
export const classes = pgTable(
  "classes",
  {
    id: integer().primaryKey(),
    slug: text().notNull().unique(),
    displayName: text().notNull(),
    ...timestamps,
  },
  (t) => [check("four_classes", sql`${t.id} between 1 and 4`)],
);
export const lessonSlots = pgTable(
  "lesson_slots",
  {
    lessonNumber: integer().primaryKey(),
    startTime: time().notNull(),
    endTime: time().notNull(),
  },
  (t) => [check("six_lesson_slots", sql`${t.lessonNumber} between 1 and 6`)],
);
export const scheduleEntries = pgTable(
  "schedule_entries",
  {
    id: uuid().defaultRandom().primaryKey(),
    classId: integer()
      .notNull()
      .references(() => classes.id),
    dayOfWeek: dayEnum().notNull(),
    lessonNumber: integer()
      .notNull()
      .references(() => lessonSlots.lessonNumber),
    subject: text().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedBy: uuid().references(() => users.id, { onDelete: "set null" }),
  },
  (t) => [
    uniqueIndex("schedule_slot_unique").on(
      t.classId,
      t.dayOfWeek,
      t.lessonNumber,
    ),
    index("schedule_class").on(t.classId),
  ],
);
export const photos = pgTable(
  "photos",
  {
    id: uuid().defaultRandom().primaryKey(),
    creationDate: date().notNull(),
    fileName: text().notNull(),
    cloudinaryPublicId: text().notNull().unique(),
    secureUrl: text().notNull(),
    title: text().notNull(),
    description: text(),
    galleryId: galleryEnum().notNull(),
    classId: integer().references(() => classes.id),
    uploadedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
    width: integer(),
    height: integer(),
    format: text(),
    bytes: integer(),
  },
  (t) => [
    index("photos_gallery_date").on(t.galleryId, t.creationDate, t.id),
    index("photos_class_date").on(t.classId, t.creationDate),
    index("photos_date").on(t.creationDate, t.id),
    check(
      "photo_gallery_class",
      sql`(${t.galleryId} = 'school' AND ${t.classId} IS NULL) OR (${t.classId} IS NOT NULL AND ${t.galleryId}::text = 'class_' || ${t.classId}::text)`,
    ),
  ],
);
export const errorLogs = pgTable("error_logs", {
  id: uuid().defaultRandom().primaryKey(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  userId: uuid().references(() => users.id, { onDelete: "set null" }),
  userEmail: text(),
  location: text().notNull(),
  errorCode: text(),
  message: text().notNull(),
  context: jsonb(),
  requestId: text(),
});
export const auditLogs = pgTable("audit_logs", {
  id: uuid().defaultRandom().primaryKey(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  userId: uuid().references(() => users.id, { onDelete: "set null" }),
  userEmail: text().notNull(),
  action: text().notNull(),
  entityType: text().notNull(),
  entityId: text(),
  classId: integer(),
  summary: text().notNull(),
});
// Durable outbox: failed Cloudinary deletions are retried by db:cleanup.
export const assetCleanupJobs = pgTable("asset_cleanup_jobs", {
  id: uuid().defaultRandom().primaryKey(),
  publicId: text().notNull().unique(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  attempts: integer().default(0).notNull(),
});
