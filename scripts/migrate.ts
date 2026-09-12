import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { db, pool } from "./database";
async function main() {
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.info("Database migrations applied.");
  } catch {
    console.error(
      "Migration failed. Check database connectivity and permissions.",
    );
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
void main();
