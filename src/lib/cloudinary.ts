import "server-only";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import sharp from "sharp";
import { env } from "./env";
import { MAX_PHOTO_BYTES, PHOTO_MIMES } from "./constants";
function storage() {
  if (
    !env.CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  )
    throw new Error("STORAGE_NOT_CONFIGURED");
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}
export async function uploadPhoto(file: File) {
  if (
    !PHOTO_MIMES.includes(file.type) ||
    file.size > MAX_PHOTO_BYTES ||
    !file.size
  )
    throw new Error("INVALID_IMAGE");
  const buffer = Buffer.from(await file.arrayBuffer());
  const isHeif = file.type === "image/heic" || file.type === "image/heif";
  if (isHeif) {
    if (
      buffer.toString("ascii", 4, 8) !== "ftyp" ||
      !/heic|heix|hevc|hevx|mif1|msf1/.test(buffer.toString("ascii", 8, 40))
    )
      throw new Error("INVALID_HEIF");
  } else {
    const metadata = await sharp(buffer, {
      limitInputPixels: 80_000_000,
    }).metadata();
    const mime = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" }[
      metadata.format as string
    ];
    if (mime !== file.type) throw new Error("INVALID_IMAGE_TYPE");
  }
  return new Promise<UploadApiResponse>((resolve, reject) => {
    storage()
      .uploader.upload_stream(
        {
          resource_type: "image",
          folder: "josypivka-school",
          allowed_formats: ["jpg", "png", "webp", "heic", "heif"],
          transformation: [
            { width: 4080, height: 4080, crop: "limit" },
            { flags: "strip_profile" },
          ],
          format: "jpg",
          timeout: 45000,
        },
        (error, result) => {
          if (error || !result) reject(error ?? new Error("UPLOAD_FAILED"));
          else resolve(result);
        },
      )
      .end(buffer);
  });
}
export async function destroyPhoto(publicId: string) {
  const result = await storage().uploader.destroy(publicId, {
    invalidate: true,
    resource_type: "image",
  });
  if (result.result !== "ok" && result.result !== "not found")
    throw new Error("ASSET_DELETE_FAILED");
}
