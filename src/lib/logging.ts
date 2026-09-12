import "server-only";
import { getDb } from "@/db";
import { errorLogs } from "@/db/schema";
import { env } from "./env";
import type { Actor } from "./permissions";
export async function logError(
  location: string,
  error: unknown,
  actor?: Actor | null,
) {
  // Log classification only: provider/DB messages can contain credentials or payloads.
  const code =
    error instanceof Error
      ? /^[A-Z][A-Z0-9_]{2,60}$/.test(error.message)
        ? error.message
        : error.name
      : "UnknownError";
  const record = {
    location,
    errorCode: code,
    message: "Operation failed",
    userId: actor?.id,
    userEmail: actor?.email,
  };
  if (!env.DATABASE_URL) {
    console.error("Operation failed", { location, code });
    return;
  }
  try {
    await getDb().insert(errorLogs).values(record);
  } catch {
    console.error("Persistent error logging unavailable", { location, code });
  }
}
