import "server-only";
import { getDb } from "@/db";
import { errorLogs } from "@/db/schema";
import { env } from "./env";
import type { Actor } from "./permissions";
function errorCode(error: unknown) {
  const detail =
    error &&
    typeof error === "object" &&
    "error" in error &&
    error.error &&
    typeof error.error === "object"
      ? error.error
      : error;
  if (detail && typeof detail === "object" && "http_code" in detail) {
    const status = detail.http_code;
    if (
      typeof status === "number" &&
      Number.isInteger(status) &&
      status >= 400 &&
      status <= 599
    )
      return `HTTP_${status}`;
  }
  if (error instanceof Error) {
    if (/^[A-Z][A-Z0-9_]{2,60}$/.test(error.message)) return error.message;
    return /^[A-Za-z][A-Za-z0-9_]{0,60}$/.test(error.name)
      ? error.name
      : "Error";
  }
  return "UnknownError";
}
export async function logError(
  location: string,
  error: unknown,
  actor?: Actor | null,
) {
  // Log classification only: provider/DB messages can contain credentials or payloads.
  const code = errorCode(error);
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
