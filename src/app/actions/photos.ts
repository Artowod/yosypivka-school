"use server";
import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { getDb } from "@/db";
import { photos, auditLogs, assetCleanupJobs } from "@/db/schema";
import { getActor } from "@/lib/session";
import { assertGalleryPermission } from "@/lib/permissions";
import { withAuthorizedTransaction } from "@/lib/transaction";
import {
  createPhotoSchema,
  editPhotoSchema,
  deletePhotoSchema,
  type PhotoQuery,
} from "@/lib/validation";
import { uploadPhoto, destroyPhoto } from "@/lib/cloudinary";
import { failure, type ActionResult } from "@/lib/actionResult";
import { getPhotos } from "@/lib/data";
import { logError } from "@/lib/logging";
import type { GalleryId } from "@/lib/constants";
function refreshGallery(gallery: GalleryId) {
  updateTag(`gallery:${gallery}`);
  updateTag("photos:archive");
  revalidatePath("/archive");
  if (gallery === "school") revalidatePath("/school-life/gallery");
  else {
    revalidatePath(`/classes/${gallery.slice(-1)}`);
    revalidatePath(`/classes/${gallery.slice(-1)}/gallery`);
  }
}
export async function readPhotos(query: PhotoQuery) {
  try {
    return { ok: true as const, data: await getPhotos(query) };
  } catch (error) {
    await logError("photos.read", error);
    return failure();
  }
}
export async function createPhoto(form: FormData): Promise<ActionResult> {
  let uploadedId: string | undefined;
  let committed = false;
  try {
    const actor = await getActor();
    const data = createPhotoSchema.parse({
      galleryId: form.get("galleryId"),
      title: form.get("title"),
      description: form.get("description"),
      creationDate: form.get("creationDate"),
    });
    assertGalleryPermission(actor, data.galleryId);
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("FILE_REQUIRED");
    const uploaded = await uploadPhoto(file);
    uploadedId = uploaded.public_id;
    await withAuthorizedTransaction(actor, async (tx, fresh) => {
      assertGalleryPermission(fresh, data.galleryId);
      const [photo] = await tx
        .insert(photos)
        .values({
          ...data,
          fileName: file.name.slice(0, 255),
          cloudinaryPublicId: uploaded.public_id,
          secureUrl: uploaded.secure_url,
          classId:
            data.galleryId === "school"
              ? null
              : Number(data.galleryId.slice(-1)),
          uploadedBy: fresh.id,
          width: uploaded.width,
          height: uploaded.height,
          format: uploaded.format,
          bytes: uploaded.bytes,
        })
        .returning();
      await tx.insert(auditLogs).values({
        userId: fresh.id,
        userEmail: fresh.email,
        action: "photo.create",
        entityType: "photo",
        entityId: photo.id,
        classId: photo.classId,
        summary: "Photo added",
      });
    });
    committed = true;
    refreshGallery(data.galleryId);
    return { ok: true, data: undefined };
  } catch (error) {
    if (uploadedId && !committed) {
      try {
        await destroyPhoto(uploadedId);
      } catch (cleanupError) {
        await logError("photo.create.cleanup", cleanupError);
        try {
          await getDb()
            .insert(assetCleanupJobs)
            .values({ publicId: uploadedId })
            .onConflictDoNothing();
        } catch (queueError) {
          await logError("photo.create.cleanupQueue", queueError);
        }
      }
    }
    await logError("photo.create", error);
    return failure();
  }
}
export async function editPhoto(input: unknown): Promise<ActionResult> {
  try {
    const actor = await getActor();
    const data = editPhotoSchema.parse(input);
    const gallery = await withAuthorizedTransaction(
      actor,
      async (tx, fresh) => {
        const [photo] = await tx
          .select()
          .from(photos)
          .where(eq(photos.id, data.id))
          .for("update");
        if (!photo) throw new Error("PHOTO_NOT_FOUND");
        assertGalleryPermission(fresh, photo.galleryId);
        await tx
          .update(photos)
          .set({
            title: data.title,
            description: data.description,
            creationDate: data.creationDate,
            updatedAt: new Date(),
          })
          .where(eq(photos.id, photo.id));
        await tx.insert(auditLogs).values({
          userId: fresh.id,
          userEmail: fresh.email,
          action: "photo.edit",
          entityType: "photo",
          entityId: photo.id,
          classId: photo.classId,
          summary: "Photo metadata edited",
        });
        return photo.galleryId;
      },
    );
    refreshGallery(gallery);
    return { ok: true, data: undefined };
  } catch (error) {
    await logError("photo.edit", error);
    return failure();
  }
}
export async function deletePhoto(input: unknown): Promise<ActionResult> {
  try {
    const actor = await getActor();
    const data = deletePhotoSchema.parse(input);
    // Queue before deleting storage. If either operation fails, the record stays
    // available and a durable job retries the complete deletion (including audit).
    const photo = await withAuthorizedTransaction(actor, async (tx, fresh) => {
      const [record] = await tx
        .select()
        .from(photos)
        .where(eq(photos.id, data.id))
        .for("update");
      if (!record) throw new Error("PHOTO_NOT_FOUND");
      assertGalleryPermission(fresh, record.galleryId);
      await tx
        .insert(assetCleanupJobs)
        .values({ publicId: record.cloudinaryPublicId })
        .onConflictDoNothing();
      return record;
    });
    await destroyPhoto(photo.cloudinaryPublicId);
    await getDb().transaction(async (tx) => {
      await tx.delete(photos).where(eq(photos.id, photo.id));
      await tx
        .delete(assetCleanupJobs)
        .where(eq(assetCleanupJobs.publicId, photo.cloudinaryPublicId));
      await tx.insert(auditLogs).values({
        userId: actor!.id,
        userEmail: actor!.email,
        action: "photo.delete",
        entityType: "photo",
        entityId: photo.id,
        classId: photo.classId,
        summary: "Photo and asset deleted",
      });
    });
    refreshGallery(photo.galleryId);
    return { ok: true, data: undefined };
  } catch (error) {
    await logError("photo.delete", error);
    return failure();
  }
}
