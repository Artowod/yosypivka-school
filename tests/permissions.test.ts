import { describe, it, expect } from "vitest";
import {
  canEditClass,
  canEditGallery,
  assertClassPermission,
  type Actor,
} from "@/lib/permissions";
const teacher: Actor = {
  id: "1",
  email: "teacher@example.test",
  name: null,
  surname: null,
  roles: ["class_1"],
};
describe("server permission policy", () => {
  it("rejects guests and signed-in visitors without roles", () => {
    expect(canEditClass(null, 1)).toBe(false);
    expect(canEditClass({ ...teacher, roles: [] }, 1)).toBe(false);
  });
  it("scopes teachers to assigned classes", () => {
    expect(canEditClass(teacher, 1)).toBe(true);
    expect(canEditClass(teacher, 2)).toBe(false);
    expect(() => assertClassPermission(teacher, 2)).toThrow();
    expect(canEditGallery(teacher, "school")).toBe(false);
  });
  it("accepts administrators with or without class roles", () => {
    for (const roles of [["admin"], ["admin", "class_1"]] as Actor["roles"][]) {
      expect(canEditClass({ ...teacher, roles }, 4)).toBe(true);
      expect(canEditGallery({ ...teacher, roles }, "school")).toBe(true);
    }
  });
  it("rejects forged class identifiers even for an admin", () => {
    expect(canEditClass({ ...teacher, roles: ["admin"] }, 5)).toBe(false);
  });
});
