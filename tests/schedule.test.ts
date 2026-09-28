import { describe, it, expect } from "vitest";
import { currentDay, localDate } from "@/lib/dates";
import { scheduleSchema, editPhotoSchema } from "@/lib/validation";
import { demoEntries } from "@/lib/demo";
describe("Kyiv calendar dates", () => {
  it("rolls over at Kyiv midnight, including the DST season", () => {
    expect(localDate(new Date("2026-01-04T22:01:00Z"))).toBe("2026-01-05");
  });
  it("identifies the current school day", () => {
    expect(currentDay(new Date("2026-09-07T12:00:00Z"))).toBe(0);
    expect(currentDay(new Date("2026-09-12T12:00:00Z"))).toBe(5);
  });
});
describe("payload validation", () => {
  const valid = { classId: 1, entries: demoEntries() };
  it("accepts a complete six-day schedule", () =>
    expect(scheduleSchema.safeParse(valid).success).toBe(true));
  it("rejects duplicate slots, wrong dates, classes and oversized subjects", () => {
    for (const input of [
      {
        ...valid,
        entries: [
          valid.entries[0],
          ...valid.entries.slice(1, 35),
          valid.entries[0],
        ],
      },
      { ...valid, weekStart: "2026-08-31" },
      { ...valid, classId: 5 },
      {
        ...valid,
        entries: valid.entries.map((e) => ({ ...e, subject: "x".repeat(121) })),
      },
    ])
      expect(scheduleSchema.safeParse(input).success).toBe(false);
  });
  it("forbids image replacement and forged gallery changes through metadata edit", () =>
    expect(
      editPhotoSchema.safeParse({
        id: "00000000-0000-4000-8000-000000000001",
        title: "Фото",
        description: "",
        creationDate: "2026-09-01",
        secureUrl: "https://attacker.test/file",
        galleryId: "class_2",
      }).success,
    ).toBe(false));
});
