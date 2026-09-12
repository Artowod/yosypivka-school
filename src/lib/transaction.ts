import "server-only";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { userRoles } from "@/db/schema";
import type { Actor } from "./permissions";
type Transaction = Parameters<
  Parameters<ReturnType<typeof getDb>["transaction"]>[0]
>[0];
// All mutations share this small-school lock. Roles are reread after acquiring it,
// so a simultaneous permission revocation cannot race a content mutation.
export async function withAuthorizedTransaction<T>(
  actor: Actor | null,
  work: (tx: Transaction, freshActor: Actor) => Promise<T>,
) {
  if (!actor) throw new Error("UNAUTHENTICATED");
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(184021)`);
    const roles = await tx
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, actor.id));
    return work(tx, { ...actor, roles: roles.map((row) => row.role) });
  });
}
