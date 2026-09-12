import { DAYS, DEFAULT_SUBJECTS, GALLERIES, type GalleryId } from "./constants";
import type { ScheduleInput } from "./validation";
export interface Photo {
  id: string;
  creationDate: string;
  title: string;
  description: string | null;
  galleryId: GalleryId;
  secureUrl: string;
  cloudinaryPublicId: string;
  width: number | null;
  height: number | null;
}
export function emptyEntries(): ScheduleInput["entries"] {
  return DAYS.flatMap((dayOfWeek) =>
    Array.from({ length: 6 }, (_, index) => ({
      dayOfWeek,
      lessonNumber: index + 1,
      subject: "",
    })),
  );
}
export function demoEntries(): ScheduleInput["entries"] {
  return emptyEntries().map((entry) => ({
    ...entry,
    subject:
      entry.dayOfWeek === "saturday"
        ? ""
        : DEFAULT_SUBJECTS[entry.lessonNumber - 1],
  }));
}
// Shared gallery/archive records, never generated separately for the Archive.
export const DEMO_PHOTOS: Photo[] = Array.from({ length: 160 }, (_, index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  creationDate: new Date(Date.UTC(2026, 7, 31 - Math.floor(index / 3)))
    .toISOString()
    .slice(0, 10),
  title: `Фото ${index + 1}`,
  description: `Тимчасове демонстраційне фото. ${"Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat((index % 4) + 1)}`,
  galleryId: GALLERIES[index % GALLERIES.length],
  secureUrl:
    index % 3 === 0
      ? "/images/school-demo-vertical.jpg"
      : "/images/school-demo-horizontal.jpg",
  cloudinaryPublicId: `demo-${index + 1}`,
  width: index % 3 === 0 ? 1292 : 4080,
  height: 2296,
})).sort(
  (a, b) =>
    b.creationDate.localeCompare(a.creationDate) || b.id.localeCompare(a.id),
);
