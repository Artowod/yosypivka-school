import type { InfiniteData } from "@tanstack/react-query";
import type { PhotoBatch } from "./data";
import type { Photo } from "./demo";

export interface PhotoChange {
  type: "created" | "updated" | "deleted";
  photo: Photo;
}

export function updateCachedPhotos(
  cached: InfiniteData<PhotoBatch> | undefined,
  change: PhotoChange,
  belongsToFilter: (photo: Photo) => boolean,
) {
  if (!cached?.pages.length) return cached;

  const existing = cached.pages
    .flatMap((page) => page.items)
    .some((photo) => photo.id === change.photo.id);
  if (change.type === "updated" && !existing) return cached;

  const photos = cached.pages
    .flatMap((page) => page.items)
    .filter((photo) => photo.id !== change.photo.id);
  if (change.type !== "deleted" && belongsToFilter(change.photo)) {
    photos.push(change.photo);
  }
  photos.sort(
    (a, b) =>
      b.creationDate.localeCompare(a.creationDate) || b.id.localeCompare(a.id),
  );

  let photoIndex = 0;
  return {
    ...cached,
    pages: cached.pages.map((page, pageIndex) => {
      const remaining = Math.max(0, photos.length - photoIndex);
      const count =
        pageIndex === cached.pages.length - 1
          ? remaining
          : Math.min(page.items.length, remaining);
      const items = photos.slice(photoIndex, photoIndex + count);
      photoIndex += count;
      return { ...page, items };
    }),
  };
}
