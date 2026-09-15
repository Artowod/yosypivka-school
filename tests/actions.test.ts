import {
  beforeAll,
  beforeEach,
  afterAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import type { Actor } from "@/lib/permissions";
import { demoEntries } from "@/lib/demo";
const state = vi.hoisted(() => ({
  actor: null as Actor | null,
  db: null as unknown,
  uploaded: vi.fn(),
  destroyed: vi.fn(),
  logs: vi.fn(),
}));
vi.mock("@/db", () => ({ getDb: () => state.db }));
vi.mock("@/lib/session", () => ({ getActor: async () => state.actor }));
vi.mock("@/lib/env", () => ({
  env: { DATABASE_URL: "configured" },
  authConfigured: true,
}));
vi.mock("@/lib/logging", () => ({ logError: state.logs }));
vi.mock("@/lib/cloudinary", () => ({
  uploadPhoto: state.uploaded,
  destroyPhoto: state.destroyed,
}));
vi.mock("next/cache", () => ({
  updateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));
import { saveSchedule } from "@/app/actions/schedule";
import { createPhoto, editPhoto, deletePhoto } from "@/app/actions/photos";
import { savePermissions, readUsers } from "@/app/actions/admin";
import { getPhotos, getSchedule } from "@/lib/data";
const client = new PGlite();
const db = drizzle(client, { schema, casing: "snake_case" });
const teacher: Actor = {
  id: "10000000-0000-4000-8000-000000000001",
  email: "teacher@example.test",
  name: "Teacher",
  surname: null,
  roles: ["class_1"],
};
const admin: Actor = {
  id: "10000000-0000-4000-8000-000000000002",
  email: "admin@example.test",
  name: "Admin",
  surname: null,
  roles: ["admin"],
};
const photoId = "20000000-0000-4000-8000-000000000001";
beforeAll(async () => {
  await client.exec(readFileSync("drizzle/0000_real_talisman.sql", "utf8"));
  state.db = db;
});
afterAll(async () => {
  await client.close();
});
beforeEach(async () => {
  await client.exec(
    "TRUNCATE audit_logs,error_logs,asset_cleanup_jobs,photos,schedule_entries,user_roles,users,lesson_slots,classes CASCADE",
  );
  await db
    .insert(schema.classes)
    .values(
      [1, 2, 3, 4].map((id) => ({
        id,
        slug: String(id),
        displayName: `${id} клас`,
      })),
    );
  await db
    .insert(schema.lessonSlots)
    .values(
      Array.from({ length: 6 }, (_, i) => ({
        lessonNumber: i + 1,
        startTime: "09:00",
        endTime: "09:30",
      })),
    );
  await db
    .insert(schema.users)
    .values(
      [teacher, admin].map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        signinDate: new Date(),
      })),
    );
  await db.insert(schema.userRoles).values([
    { userId: teacher.id, role: "class_1" },
    { userId: admin.id, role: "admin" },
  ]);
  state.actor = teacher;
  vi.clearAllMocks();
  state.uploaded.mockResolvedValue({
    public_id: "school/new-photo",
    secure_url: "https://res.cloudinary.com/school/image/upload/new.jpg",
    width: 100,
    height: 100,
    format: "jpg",
    bytes: 100,
  });
  state.destroyed.mockResolvedValue(undefined);
});
async function insertPhoto() {
  await db
    .insert(schema.photos)
    .values({
      id: photoId,
      title: "Before",
      description: "Description",
      creationDate: "2026-09-01",
      fileName: "photo.jpg",
      cloudinaryPublicId: "school/existing-photo",
      secureUrl: "https://res.cloudinary.com/school/image/upload/photo.jpg",
      galleryId: "class_1",
      classId: 1,
    });
}
function uploadForm(title = "New photo", galleryId = "class_1") {
  const form = new FormData();
  form.set("title", title);
  form.set("description", "");
  form.set("creationDate", "2026-09-01");
  form.set("galleryId", galleryId);
  form.set(
    "file",
    new File([new Uint8Array([1, 2, 3])], "photo.jpg", { type: "image/jpeg" }),
  );
  return form;
}
describe("protected schedule actions with PostgreSQL", () => {
  const input = { classId: 1, weekStart: "2026-08-31", entries: demoEntries() };
  it("rejects unauthenticated and forged class saves", async () => {
    state.actor = null;
    expect((await saveSchedule(input)).ok).toBe(false);
    state.actor = teacher;
    expect((await saveSchedule({ ...input, classId: 2 })).ok).toBe(false);
    expect(await db.select().from(schema.scheduleEntries)).toHaveLength(0);
  });
  it("saves assigned class, preserves prior weeks and audits", async () => {
    expect((await saveSchedule(input)).ok).toBe(true);
    expect((await saveSchedule({ ...input, weekStart: "2026-09-07" })).ok).toBe(
      true,
    );
    expect(await db.select().from(schema.scheduleEntries)).toHaveLength(72);
    expect(await db.select().from(schema.auditLogs)).toHaveLength(2);
  });
  it("allows admin all classes", async () => {
    state.actor = admin;
    expect((await saveSchedule({ ...input, classId: 4 })).ok).toBe(true);
  });
  it("rereads DB roles and rejects a stale authorized session", async () => {
    await db
      .delete(schema.userRoles)
      .where(eq(schema.userRoles.userId, teacher.id));
    expect((await saveSchedule(input)).ok).toBe(false);
  });
  it("rejects invalid payload before writing", async () => {
    expect((await saveSchedule({ ...input, weekStart: "2026-09-01" })).ok).toBe(
      false,
    );
    expect(await db.select().from(schema.scheduleEntries)).toHaveLength(0);
  });
  it("enforces unique class/week/day/lesson at DB level", async () => {
    await saveSchedule(input);
    await expect(
      db
        .insert(schema.scheduleEntries)
        .values({
          ...input.entries[0],
          classId: 1,
          weekStart: input.weekStart,
        }),
    ).rejects.toThrow();
  });
  it("has a friendly empty current-week model", async () => {
    const result = await getSchedule(1, "2026-08-31");
    expect(result.entries).toHaveLength(36);
    expect(result.entries.every((entry) => !entry.subject)).toBe(true);
  });
});
describe("gallery writes and shared Archive", () => {
  it("creates authorized photos and returns the same record through archive", async () => {
    expect((await createPhoto(uploadForm())).ok).toBe(true);
    const gallery = await getPhotos({ galleryId: "class_1" });
    const archive = await getPhotos({});
    expect(gallery.items).toHaveLength(1);
    expect(archive.items[0].id).toBe(gallery.items[0].id);
  });
  it("rejects guests, other classes and school gallery before upload", async () => {
    state.actor = null;
    expect((await createPhoto(uploadForm())).ok).toBe(false);
    state.actor = teacher;
    expect((await createPhoto(uploadForm("No", "class_2"))).ok).toBe(false);
    expect((await createPhoto(uploadForm("No", "school"))).ok).toBe(false);
    expect(state.uploaded).not.toHaveBeenCalled();
  });
  it("edits metadata but cannot move/replace the asset", async () => {
    await insertPhoto();
    expect(
      (
        await editPhoto({
          id: photoId,
          title: "Updated",
          description: "",
          creationDate: "2026-09-02",
        })
      ).ok,
    ).toBe(true);
    const [photo] = await db.select().from(schema.photos);
    expect(photo.title).toBe("Updated");
    expect(photo.cloudinaryPublicId).toBe("school/existing-photo");
    expect(
      (
        await editPhoto({
          id: photoId,
          title: "Forged",
          description: "",
          creationDate: "2026-09-02",
          galleryId: "class_2",
        })
      ).ok,
    ).toBe(false);
  });
  it("checks the actual record's gallery on edit and delete", async () => {
    await insertPhoto();
    state.actor = { ...teacher, roles: ["class_2"] };
    await db
      .update(schema.userRoles)
      .set({ role: "class_2" })
      .where(eq(schema.userRoles.userId, teacher.id));
    expect(
      (
        await editPhoto({
          id: photoId,
          title: "No",
          description: "",
          creationDate: "2026-09-01",
        })
      ).ok,
    ).toBe(false);
    expect((await deletePhoto({ id: photoId, confirmed: true })).ok).toBe(
      false,
    );
    expect(state.destroyed).not.toHaveBeenCalled();
  });
  it("requires deletion confirmation and deletes storage plus record", async () => {
    await insertPhoto();
    expect((await deletePhoto({ id: photoId, confirmed: false })).ok).toBe(
      false,
    );
    expect((await deletePhoto({ id: photoId, confirmed: true })).ok).toBe(true);
    expect(state.destroyed).toHaveBeenCalledWith("school/existing-photo");
    expect(await db.select().from(schema.photos)).toHaveLength(0);
    expect(await db.select().from(schema.assetCleanupJobs)).toHaveLength(0);
  });
  it("keeps a durable retry job when Cloudinary deletion fails", async () => {
    await insertPhoto();
    state.destroyed.mockRejectedValueOnce(new Error("provider failed"));
    expect((await deletePhoto({ id: photoId, confirmed: true })).ok).toBe(
      false,
    );
    expect(await db.select().from(schema.photos)).toHaveLength(1);
    expect(await db.select().from(schema.assetCleanupJobs)).toHaveLength(1);
    expect(state.logs).toHaveBeenCalled();
  });
  it("cleans an uploaded file if DB creation fails", async () => {
    await client.exec(
      "ALTER TABLE photos ADD CONSTRAINT test_failure CHECK (title <> 'reject-this-photo')",
    );
    try {
      expect((await createPhoto(uploadForm("reject-this-photo"))).ok).toBe(
        false,
      );
      expect(state.destroyed).toHaveBeenCalledWith("school/new-photo");
      expect(await db.select().from(schema.photos)).toHaveLength(0);
    } finally {
      await client.exec("ALTER TABLE photos DROP CONSTRAINT test_failure");
    }
  });
  it("reports upload failure without fake gallery records", async () => {
    const providerError = { http_code: 401, message: "provider failed" };
    state.uploaded.mockRejectedValueOnce(providerError);
    expect((await createPhoto(uploadForm())).ok).toBe(false);
    expect(await db.select().from(schema.photos)).toHaveLength(0);
    expect(state.logs).toHaveBeenCalledWith(
      "photo.create.upload",
      providerError,
      teacher,
    );
  });
});
describe("administration", () => {
  it("rejects non-admin permission changes and reads", async () => {
    expect(
      (
        await savePermissions({
          userId: teacher.id,
          roles: ["admin"],
          confirmLastAdmin: false,
        })
      ).ok,
    ).toBe(false);
    expect((await readUsers()).ok).toBe(false);
  });
  it("supports combined roles transactionally", async () => {
    state.actor = admin;
    expect(
      (
        await savePermissions({
          userId: teacher.id,
          roles: ["admin", "class_1", "class_3"],
          confirmLastAdmin: false,
        })
      ).ok,
    ).toBe(true);
    const roles = await db
      .select()
      .from(schema.userRoles)
      .where(eq(schema.userRoles.userId, teacher.id));
    expect(roles.map((row) => row.role).sort()).toEqual([
      "admin",
      "class_1",
      "class_3",
    ]);
  });
  it("requires explicit confirmation to remove the final admin", async () => {
    state.actor = admin;
    const result = await savePermissions({
      userId: admin.id,
      roles: [],
      confirmLastAdmin: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("LAST_ADMIN");
    expect(
      (
        await savePermissions({
          userId: admin.id,
          roles: [],
          confirmLastAdmin: true,
        })
      ).ok,
    ).toBe(true);
  });
  it("rolls roles back if auditing fails", async () => {
    state.actor = admin;
    await client.exec(
      "ALTER TABLE audit_logs ADD CONSTRAINT test_audit_failure CHECK (action <> 'permissions.update')",
    );
    try {
      expect(
        (
          await savePermissions({
            userId: teacher.id,
            roles: ["class_4"],
            confirmLastAdmin: false,
          })
        ).ok,
      ).toBe(false);
      const roles = await db
        .select()
        .from(schema.userRoles)
        .where(eq(schema.userRoles.userId, teacher.id));
      expect(roles[0].role).toBe("class_1");
    } finally {
      await client.exec(
        "ALTER TABLE audit_logs DROP CONSTRAINT test_audit_failure",
      );
    }
  });
});
