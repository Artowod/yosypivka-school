"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { scheduleEntries, auditLogs } from "@/db/schema";
import { scheduleSchema, classIdSchema, dateSchema } from "@/lib/validation";
import { getActor } from "@/lib/session";
import { assertClassPermission } from "@/lib/permissions";
import { withAuthorizedTransaction } from "@/lib/transaction";
import { getSchedule } from "@/lib/data";
import { failure, type ActionResult } from "@/lib/actionResult";
import { logError } from "@/lib/logging";
export async function readSchedule(classId: number, week: string) {
  try {
    return {
      ok: true as const,
      data: await getSchedule(
        classIdSchema.parse(classId),
        dateSchema.parse(week),
      ),
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
        .where(
          and(
            eq(scheduleEntries.classId, data.classId),
            eq(scheduleEntries.weekStart, data.weekStart),
          ),
        );
      await tx.insert(scheduleEntries).values(
        data.entries.map((entry) => ({
          ...entry,
          classId: data.classId,
          weekStart: data.weekStart,
          updatedBy: fresh.id,
        })),
      );
      await tx.insert(auditLogs).values({
        userId: fresh.id,
        userEmail: fresh.email,
        action: "schedule.update",
        entityType: "schedule",
        entityId: data.weekStart,
        classId: data.classId,
        summary: "Weekly schedule saved",
      });
    });
    updateTag(`schedule:class:${data.classId}:week:${data.weekStart}`);
    revalidatePath(`/classes/${data.classId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    await logError("schedule.save", error);
    return failure();
  }
}
