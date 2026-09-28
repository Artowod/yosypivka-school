import { z } from "zod/v4";
import { DAYS, GALLERIES, ROLES } from "./constants";
export const classIdSchema = z.number().int().min(1).max(4);
export const dateSchema = z.iso.date();
export const scheduleSchema = z
  .object({
    classId: classIdSchema,
    entries: z
      .array(
        z
          .object({
            dayOfWeek: z.enum(DAYS),
            lessonNumber: z.number().int().min(1).max(6),
            subject: z.string().trim().max(120, "До 120 символів"),
          })
          .strict(),
      )
      .length(36),
  })
  .strict()
  .refine(
    (value) =>
      new Set(
        value.entries.map(
          (entry) => `${entry.dayOfWeek}:${entry.lessonNumber}`,
        ),
      ).size === 36,
    "Уроки не можуть повторюватися",
  );
export type ScheduleInput = z.infer<typeof scheduleSchema>;
export const photoMetadataSchema = z.object({
  title: z.string().trim().min(1, "Вкажіть назву").max(160),
  description: z.string().trim().max(3000),
  creationDate: dateSchema,
});
export const createPhotoSchema = photoMetadataSchema
  .extend({ galleryId: z.enum(GALLERIES) })
  .strict();
export const editPhotoSchema = photoMetadataSchema
  .extend({ id: z.uuid() })
  .strict();
export const deletePhotoSchema = z
  .object({ id: z.uuid(), confirmed: z.literal(true) })
  .strict();
export const permissionsSchema = z
  .object({
    userId: z.uuid(),
    roles: z.array(z.enum(ROLES)).max(5),
    confirmLastAdmin: z.boolean(),
  })
  .strict();
export const photoQuerySchema = z
  .object({
    galleryId: z.enum(GALLERIES).optional(),
    year: z.coerce.number().int().min(1900).max(2200).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    limit: z.number().int().min(1).max(50).default(10),
    cursor: z.object({ date: dateSchema, id: z.uuid() }).optional(),
  })
  .strict();
export type PhotoQuery = z.input<typeof photoQuerySchema>;
