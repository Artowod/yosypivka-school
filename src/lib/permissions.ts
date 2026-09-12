import type { GalleryId, Role } from "./constants";
export interface Actor {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  roles: Role[];
}
export function canEditClass(actor: Actor | null, classId: number) {
  return (
    [1, 2, 3, 4].includes(classId) &&
    !!actor &&
    (actor.roles.includes("admin") ||
      actor.roles.includes(`class_${classId}` as Role))
  );
}
export function canEditGallery(actor: Actor | null, galleryId: GalleryId) {
  return galleryId === "school"
    ? !!actor?.roles.includes("admin")
    : canEditClass(actor, Number(galleryId.slice(-1)));
}
export function assertClassPermission(actor: Actor | null, classId: number) {
  if (!canEditClass(actor, classId)) throw new Error("FORBIDDEN");
}
export function assertGalleryPermission(
  actor: Actor | null,
  galleryId: GalleryId,
) {
  if (!canEditGallery(actor, galleryId)) throw new Error("FORBIDDEN");
}
export function assertAdmin(actor: Actor | null): asserts actor is Actor {
  if (!actor?.roles.includes("admin")) throw new Error("FORBIDDEN");
}
