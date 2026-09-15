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
import type { Photo } from "@/lib/demo";
const publicPhotoColumns = {
  id: photos.id,
  creationDate: photos.creationDate,
  title: photos.title,
  description: photos.description,
  galleryId: photos.galleryId,
  secureUrl: photos.secureUrl,
  cloudinaryPublicId: photos.cloudinaryPublicId,
  width: photos.width,
  height: photos.height,
  classId: photos.classId,
};
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
export async function createPhoto(form: FormData): Promise<ActionResult<Photo>> {
  let uploadedId: string | undefined;
  let committed = false;
  let actor: Awaited<ReturnType<typeof getActor>> = null;
  let stage = "authentication";
  try {
    actor = await getActor();
    stage = "validation";
    const data = createPhotoSchema.parse({
      galleryId: form.get("galleryId"),
      title: form.get("title"),
      description: form.get("description"),
      creationDate: form.get("creationDate"),
    });
    assertGalleryPermission(actor, data.galleryId);
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("FILE_REQUIRED");
    stage = "upload";
    const uploaded = await uploadPhoto(file);
    uploadedId = uploaded.public_id;
    stage = "database";
    const createdPhoto = await withAuthorizedTransaction(actor, async (tx, fresh) => {
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
        .returning(publicPhotoColumns);
      await tx.insert(auditLogs).values({
        userId: fresh.id,
        userEmail: fresh.email,
        action: "photo.create",
        entityType: "photo",
        entityId: photo.id,
        classId: photo.classId,
        summary: "Photo added",
      });
      return photo;
    });
    committed = true;
    stage = "revalidation";
    refreshGallery(data.galleryId);
    return { ok: true, data: createdPhoto };
  } catch (error) {
    if (uploadedId && !committed) {
      try {
        await destroyPhoto(uploadedId);
      } catch (cleanupError) {
        await logError("photo.create.cleanup", cleanupError, actor);
        try {
          await getDb()
            .insert(assetCleanupJobs)
            .values({ publicId: uploadedId })
            .onConflictDoNothing();
        } catch (queueError) {
          await logError("photo.create.cleanupQueue", queueError, actor);
        }
      }
    }
    await logError(`photo.create.${stage}`, error, actor);
    return failure();
  }
}
export async function editPhoto(input: unknown): Promise<ActionResult<Photo>> {
  try {
    const actor = await getActor();
    const data = editPhotoSchema.parse(input);
    const updatedPhoto = await withAuthorizedTransaction(
      actor,
      async (tx, fresh) => {
        const [photo] = await tx
          .select()
          .from(photos)
          .where(eq(photos.id, data.id))
          .for("update");
        if (!photo) throw new Error("PHOTO_NOT_FOUND");
        assertGalleryPermission(fresh, photo.galleryId);
        const [updated] = await tx
          .update(photos)
          .set({
            title: data.title,
            description: data.description,
            creationDate: data.creationDate,
            updatedAt: new Date(),
          })
          .where(eq(photos.id, photo.id))
          .returning(publicPhotoColumns);
        if (!updated) throw new Error("PHOTO_UPDATE_FAILED");
        await tx.insert(auditLogs).values({
          userId: fresh.id,
          userEmail: fresh.email,
          action: "photo.edit",
          entityType: "photo",
          entityId: photo.id,
          classId: photo.classId,
          summary: "Photo metadata edited",
        });
        return updated;
      },
    );
    refreshGallery(updatedPhoto.galleryId);
    return { ok: true, data: updatedPhoto };
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
