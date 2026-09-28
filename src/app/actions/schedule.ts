"use server";
import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { scheduleEntries, auditLogs } from "@/db/schema";
import { scheduleSchema, classIdSchema } from "@/lib/validation";
import { getActor } from "@/lib/session";
import { assertClassPermission } from "@/lib/permissions";
import { withAuthorizedTransaction } from "@/lib/transaction";
import { getSchedule } from "@/lib/data";
import { failure, type ActionResult } from "@/lib/actionResult";
import { logError } from "@/lib/logging";
export async function readSchedule(classId: number) {
  try {
    return {
      ok: true as const,
      data: await getSchedule(classIdSchema.parse(classId)),
    };
  } catch (error) {
    await logError("schedule.read", error);
    return failure();
  }
}
export async function saveSchedule(input: unknown): Promise<ActionResult> {
  try {
    const actor = await getActor();
    const data = scheduleSchema.parse(input);
    await withAuthorizedTransaction(actor, async (tx, fresh) => {
      assertClassPermission(fresh, data.classId);
      await tx
        .delete(scheduleEntries)
        .where(eq(scheduleEntries.classId, data.classId));
      await tx.insert(scheduleEntries).values(
        data.entries.map((entry) => ({
          ...entry,
          classId: data.classId,
          updatedBy: fresh.id,
        })),
      );
      await tx.insert(auditLogs).values({
        userId: fresh.id,
        userEmail: fresh.email,
        action: "schedule.update",
        entityType: "schedule",
        entityId: String(data.classId),
        classId: data.classId,
        summary: "Class schedule saved",
      });
    });
    updateTag(`schedule:class:${data.classId}`);
    revalidatePath(`/classes/${data.classId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    await logError("schedule.save", error);
    return failure();
  }
}
