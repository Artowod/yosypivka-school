"use server";
import { eq, isNotNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { users, userRoles, auditLogs } from "@/db/schema";
import { getActor } from "@/lib/session";
import { assertAdmin } from "@/lib/permissions";
import { withAuthorizedTransaction } from "@/lib/transaction";
import { permissionsSchema } from "@/lib/validation";
import { failure, type ActionResult } from "@/lib/actionResult";
import { logError } from "@/lib/logging";
export async function readUsers() {
  try {
    assertAdmin(await getActor());
    const [allUsers, roles] = await Promise.all([
      getDb()
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          surname: users.surname,
        })
        .from(users)
        .where(isNotNull(users.signinDate))
        .orderBy(users.email),
      getDb().select().from(userRoles),
    ]);
    return {
      ok: true as const,
      data: allUsers.map((user) => ({
        ...user,
        roles: roles
          .filter((role) => role.userId === user.id)
          .map((role) => role.role),
      })),
    };
  } catch (error) {
    await logError("admin.users", error);
    return failure();
  }
}
export async function savePermissions(input: unknown): Promise<ActionResult> {
  try {
    const actor = await getActor();
    assertAdmin(actor);
    const data = permissionsSchema.parse(input);
    await withAuthorizedTransaction(actor, async (tx, fresh) => {
      assertAdmin(fresh);
      const [target] = await tx
        .select()
        .from(users)
        .where(eq(users.id, data.userId));
      if (!target?.signinDate) throw new Error("USER_NOT_FOUND");
      const admins = await tx
        .select()
        .from(userRoles)
        .where(eq(userRoles.role, "admin"));
      if (
        admins.length === 1 &&
        admins[0].userId === data.userId &&
        !data.roles.includes("admin") &&
        !data.confirmLastAdmin
      )
        throw new Error("LAST_ADMIN");
      await tx.delete(userRoles).where(eq(userRoles.userId, data.userId));
      const roles = [...new Set(data.roles)];
      if (roles.length)
        await tx
          .insert(userRoles)
          .values(roles.map((role) => ({ userId: data.userId, role })));
      await tx
        .update(users)
        .set({ updatedAt: sql`now()` })
        .where(eq(users.id, data.userId));
      await tx.insert(auditLogs).values({
        userId: fresh.id,
        userEmail: fresh.email,
        action: "permissions.update",
        entityType: "user",
        entityId: data.userId,
        summary: `Roles: ${roles.join(", ") || "none"}`,
      });
    });
    revalidatePath("/admin");
    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === "LAST_ADMIN")
      return {
        ok: false,
        code: "LAST_ADMIN",
        message:
          "Це останній адміністратор. Після зняття прав керування доступом стане недоступним. Підтвердіть цю зміну.",
      };
    await logError("admin.permissions", error);
    return failure();
  }
}
