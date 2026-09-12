import { eq, lt, sql } from "drizzle-orm";
import { v2 as cloudinary } from "cloudinary";
import { db, pool } from "./database";
import {
  assetCleanupJobs,
  photos,
  auditLogs,
  errorLogs,
} from "../src/db/schema";
async function main() {
  try {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    )
      throw new Error("STORAGE_NOT_CONFIGURED");
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    const jobs = await db
      .select()
      .from(assetCleanupJobs)
      .where(lt(assetCleanupJobs.createdAt, new Date(Date.now() - 3600000)))
      .limit(100);
    for (const job of jobs) {
      try {
        if (!job.publicId.startsWith("demo-")) {
          const result = await cloudinary.uploader.destroy(job.publicId, {
            invalidate: true,
          });
          if (!["ok", "not found"].includes(result.result))
            throw new Error("DELETE_FAILED");
        }
        await db.transaction(async (tx) => {
          const deleted = await tx
            .delete(photos)
            .where(eq(photos.cloudinaryPublicId, job.publicId))
            .returning();
          await tx
            .delete(assetCleanupJobs)
            .where(eq(assetCleanupJobs.id, job.id));
          if (deleted.length)
            await tx.insert(auditLogs).values({
              userEmail: "system:storage-cleanup",
              action: "photo.delete",
              entityType: "photo",
              entityId: deleted[0].id,
              classId: deleted[0].classId,
              summary: "Completed previously authorized photo deletion",
            });
        });
      } catch {
        await db
          .update(assetCleanupJobs)
          .set({ attempts: sql`${assetCleanupJobs.attempts}+1` })
          .where(eq(assetCleanupJobs.id, job.id));
        await db.insert(errorLogs).values({
          location: "storage.cleanup",
          errorCode: "CLEANUP_FAILED",
          message: "Asset cleanup will be retried",
          context: { jobId: job.id },
        });
        process.exitCode = 1;
      }
    }
    // Small logs stay free-tier friendly. Audit records are retained for one year.
    await db
      .delete(errorLogs)
      .where(lt(errorLogs.createdAt, new Date(Date.now() - 90 * 86400000)));
    await db
      .delete(auditLogs)
      .where(lt(auditLogs.createdAt, new Date(Date.now() - 365 * 86400000)));
    console.info(
      `Processed ${jobs.length} cleanup jobs. ISR refreshes public photo data within an hour.`,
    );
  } catch {
    console.error(
      "Cleanup failed. Check service connectivity and environment settings.",
    );
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
void main();
