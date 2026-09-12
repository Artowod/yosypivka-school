import "server-only";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { users, userRoles } from "@/db/schema";
import { authConfigured } from "./env";
import type { Actor } from "./permissions";
export async function getActor(): Promise<Actor | null> {
  if (!authConfigured) return null;
  const session = await auth();
  if (!session?.user?.email) return null;
  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, session.user.email.toLowerCase()))
    .limit(1);
  if (!user) return null;
  const roles = await getDb()
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, user.id));
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    surname: user.surname,
    roles: roles.map((row) => row.role),
  };
}
