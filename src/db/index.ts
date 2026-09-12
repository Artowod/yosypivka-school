import "server-only";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";
import { env } from "@/lib/env";
neonConfig.webSocketConstructor = ws;
let database: NeonDatabase<typeof schema> | undefined;
export function getDb() {
  if (!env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  database ??= drizzle(
    new Pool({
      connectionString: env.DATABASE_URL,
      max: 3,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
    }),
    { schema, casing: "snake_case" },
  );
  return database;
}
