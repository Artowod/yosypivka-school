import { eq } from "drizzle-orm";
import { db, pool } from "./database";
import {
  classes,
  lessonSlots,
  users,
  userRoles,
  scheduleEntries,
  photos,
} from "../src/db/schema";
import { CLASS_IDS, LESSON_SLOTS, type Role } from "../src/lib/constants";
import { demoEntries, DEMO_PHOTOS } from "../src/lib/demo";
async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "Development seed is disabled in production. Bootstrap the administrator explicitly; see README.",
    );
    await pool.end();
    process.exitCode = 1;
    return;
  }
  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(classes)
        .values(
          CLASS_IDS.map((id) => ({
            id,
            slug: String(id),
            displayName: `${id} клас`,
          })),
        )
        .onConflictDoNothing();
      await tx
        .insert(lessonSlots)
        .values(
          LESSON_SLOTS.map((slot, index) => ({
            lessonNumber: index + 1,
            startTime: slot.split("–")[0],
            endTime: slot.split("–")[1],
          })),
        )
        .onConflictDoNothing();
      const seeds = [
        { email: "myjavaname@gmail.com", role: "admin" as Role },
        { email: "lukavenko.sergii.webdev@gmail.com", role: "class_1" as Role },
      ];
      for (const seed of seeds) {
        const [created] = await tx
          .insert(users)
          .values({ email: seed.email, name: "Сергій", surname: "Лукавенко" })
          .onConflictDoNothing()
          .returning();
        if (created)
          await tx
            .insert(userRoles)
            .values({ userId: created.id, role: seed.role });
      }
      await tx
        .insert(scheduleEntries)
        .values(
          CLASS_IDS.flatMap((classId) =>
            demoEntries().map((entry) => ({
              ...entry,
              classId,
            })),
          ),
        )
        .onConflictDoNothing();
      for (const photo of DEMO_PHOTOS) {
        await tx
          .insert(photos)
          .values({
            ...photo,
            fileName: photo.secureUrl.split("/").at(-1)!,
            classId:
              photo.galleryId === "school"
                ? null
                : Number(photo.galleryId.slice(-1)),
          })
          .onConflictDoNothing();
      }
      // Keep sign-in dates empty until a genuine verified Google login occurs.
      const [admin] = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, seeds[0].email));
      if (!admin) throw new Error("SEED_FAILED");
    });
    console.info(
      "Development classes, users, schedules and shared demo photos are ready. Existing roles and schedules were preserved.",
    );
  } catch {
    console.error(
      "Seed failed; transaction rolled back. Check database setup.",
    );
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
void main();
