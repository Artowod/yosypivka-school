import "server-only";
import { unstable_cache } from "next/cache";
import { and, desc, eq, lt, or, gte, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { photos, scheduleEntries, lessonSlots } from "@/db/schema";
import { env } from "./env";
import { DEMO_PHOTOS, demoEntries, emptyEntries, type Photo } from "./demo";
import { photoQuerySchema, type PhotoQuery } from "./validation";
import { LESSON_SLOTS } from "./constants";

export async function getSchedule(classId: number, week: string) {
  if (!env.DATABASE_URL)
    return { entries: demoEntries(), demo: true, slots: LESSON_SLOTS };
  return unstable_cache(
    async () => {
      const [entries, slots] = await Promise.all([
        getDb()
          .select({
            dayOfWeek: scheduleEntries.dayOfWeek,
            lessonNumber: scheduleEntries.lessonNumber,
            subject: scheduleEntries.subject,
          })
          .from(scheduleEntries)
          .where(
            and(
              eq(scheduleEntries.classId, classId),
              eq(scheduleEntries.weekStart, week),
            ),
          ),
        getDb().select().from(lessonSlots).orderBy(lessonSlots.lessonNumber),
      ]);
      return {
        entries: entries.length ? entries : emptyEntries(),
        demo: false,
        slots:
          slots.length === 6
            ? slots.map(
                (slot) =>
                  `${slot.startTime.slice(0, 5)}–${slot.endTime.slice(0, 5)}`,
              )
            : LESSON_SLOTS,
      };
    },
    ["schedule", String(classId), week],
    {
      tags: [`schedule:class:${classId}:week:${week}`, `class:${classId}`],
      revalidate: 60,
    },
  )();
}
export interface PhotoBatch {
  items: Photo[];
  nextCursor?: { date: string; id: string };
  demo: boolean;
}
export async function getPhotos(input: PhotoQuery): Promise<PhotoBatch> {
  const query = photoQuerySchema.parse(input);
  const from = query.year
    ? `${query.year}-${String(query.month ?? 1).padStart(2, "0")}-01`
    : undefined;
  const until = query.year
    ? new Date(Date.UTC(query.year, query.month ?? 12, 0))
        .toISOString()
        .slice(0, 10)
    : undefined;
  if (!env.DATABASE_URL) {
    const result = DEMO_PHOTOS.filter(
      (photo) =>
        (!query.galleryId || photo.galleryId === query.galleryId) &&
        (!from || photo.creationDate >= from) &&
        (!until || photo.creationDate <= until) &&
        (!query.month ||
          query.year ||
          Number(photo.creationDate.slice(5, 7)) === query.month) &&
        (!query.cursor ||
          photo.creationDate < query.cursor.date ||
          (photo.creationDate === query.cursor.date &&
            photo.id < query.cursor.id)),
    ).slice(0, query.limit + 1);
    return batch(result, query.limit, true);
  }
  return unstable_cache(
    async () => {
      const result = await getDb()
        .select({
          id: photos.id,
          creationDate: photos.creationDate,
          title: photos.title,
          description: photos.description,
          galleryId: photos.galleryId,
          secureUrl: photos.secureUrl,
          cloudinaryPublicId: photos.cloudinaryPublicId,
          width: photos.width,
          height: photos.height,
        })
        .from(photos)
        .where(
          and(
            query.galleryId ? eq(photos.galleryId, query.galleryId) : undefined,
            from ? gte(photos.creationDate, from) : undefined,
            until ? lte(photos.creationDate, until) : undefined,
            query.cursor
              ? or(
                  lt(photos.creationDate, query.cursor.date),
                  and(
                    eq(photos.creationDate, query.cursor.date),
                    lt(photos.id, query.cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(photos.creationDate), desc(photos.id))
        .limit(query.limit + 1);
      return batch(result, query.limit, false);
    },
    ["photos", JSON.stringify(query)],
    {
      tags: query.galleryId
        ? [`gallery:${query.galleryId}`]
        : ["photos:archive"],
      revalidate: 3600,
    },
  )();
}
function batch(result: Photo[], limit: number, demo: boolean): PhotoBatch {
  const items = result.slice(0, limit);
  const last = items.at(-1);
  return {
    items,
    demo,
    nextCursor:
      result.length > limit && last
        ? { date: last.creationDate, id: last.id }
        : undefined,
  };
}
