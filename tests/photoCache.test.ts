import { describe, expect, it } from "vitest";
import type { InfiniteData } from "@tanstack/react-query";
import type { PhotoBatch } from "@/lib/data";
import type { Photo } from "@/lib/demo";
import { updateCachedPhotos } from "@/lib/photoCache";

function photo(id: string, title = id): Photo {
  return {
    id,
    title,
    description: null,
    creationDate: `2026-09-${id.padStart(2, "0")}`,
    galleryId: "school",
    secureUrl: `/photo-${id}.jpg`,
    cloudinaryPublicId: `photo-${id}`,
    width: 100,
    height: 100,
  };
}

const visible = () => true;

describe("photo infinite-query cache", () => {
  it("preserves every loaded photo when a photo is created or edited", () => {
    const cached: InfiniteData<PhotoBatch> = {
      pages: [
        { items: [photo("04"), photo("03")], demo: false },
        { items: [photo("02"), photo("01")], demo: false },
      ],
      pageParams: [undefined, { date: "2026-09-03", id: "03" }],
    };
    const created = updateCachedPhotos(
      cached,
      { type: "created", photo: photo("05") },
      visible,
    )!;
    expect(created.pages.flatMap((page) => page.items).map(({ id }) => id)).toEqual([
      "05",
      "04",
      "03",
      "02",
      "01",
    ]);

    const edited = updateCachedPhotos(
      created,
      { type: "updated", photo: photo("03", "Оновлена назва") },
      visible,
    )!;
    const items = edited.pages.flatMap((page) => page.items);
    expect(items).toHaveLength(5);
    expect(items.find(({ id }) => id === "03")?.title).toBe("Оновлена назва");
  });
});
