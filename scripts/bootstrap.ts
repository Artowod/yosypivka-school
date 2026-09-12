import { z } from "zod/v4";
import { eq } from "drizzle-orm";
import { db, pool } from "./database";
import {
  classes,
  lessonSlots,
  users,
  userRoles,
  auditLogs,
} from "../src/db/schema";
import { CLASS_IDS, LESSON_SLOTS } from "../src/lib/constants";

async function main() {
  const email = z.email().safeParse(process.argv[2]?.toLowerCase());
  if (!email.success) {
    console.error("Usage: npm run db:bootstrap -- verified-owner-email");
    await pool.end();
    process.exitCode = 1;
    return;
  }
  try {
    await db.transaction(async (tx) => {
      const [owner] = await tx
        .select()
        .from(users)
        .where(eq(users.email, email.data));
      if (!owner?.signinDate) throw new Error("OWNER_MUST_SIGN_IN_FIRST");
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
      const assigned = await tx
        .insert(userRoles)
        .values({ userId: owner.id, role: "admin" })
        .onConflictDoNothing()
        .returning();
      if (assigned.length)
        await tx
          .insert(auditLogs)
          .values({
            userId: owner.id,
            userEmail: owner.email,
            action: "permissions.bootstrap",
            entityType: "user",
            entityId: owner.id,
            summary:
              "Database owner explicitly bootstrapped administrator access",
          });
    });
    console.info(
      "Four classes, lesson slots and administrator access are ready. No demo content was inserted.",
    );
  } catch {
    console.error(
      "Bootstrap failed. The owner must first sign in with Google; also check the migrated database connection.",
    );
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
void main();
