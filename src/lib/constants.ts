export const CLASS_IDS = [1, 2, 3, 4] as const;
export const ROLES = [
  "admin",
  "class_1",
  "class_2",
  "class_3",
  "class_4",
] as const;
export type Role = (typeof ROLES)[number];
export const GALLERIES = [
  "school",
  "class_1",
  "class_2",
  "class_3",
  "class_4",
] as const;
export type GalleryId = (typeof GALLERIES)[number];
export const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;
export const DAY_NAMES = [
  "Понеділок",
  "Вівторок",
  "Середа",
  "Четвер",
  "П’ятниця",
  "Субота",
];
export const DEFAULT_SUBJECTS = [
  "Навчання грамоти (читання)",
  "Математика",
  "Навчання грамоти (письмо)",
  "Мистецтво (музичне)",
  "Фізична культура",
  "",
];
export const LESSON_SLOTS = [
  "09:00–09:30",
  "09:40–10:10",
  "10:30–11:00",
  "11:20–11:50",
  "12:00–12:30",
  "12:40–13:10",
];
export const FRIENDLY_ERROR =
  "Щось пішло не за планом. Спробуйте трохи пізніше.";
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];
export const SCHOOL_NAME = "Йосипівська початкова школа";
export const TIME_ZONE = "Europe/Kyiv";
