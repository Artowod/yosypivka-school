import { loadEnvConfig } from "@next/env";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "../src/db/schema";
loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL)
  throw new Error(
    "Set DATABASE_URL in .env.local before running database commands.",
  );
neonConfig.webSocketConstructor = ws;
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
});
export const db = drizzle(pool, { schema, casing: "snake_case" });
