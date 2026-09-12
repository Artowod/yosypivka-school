import { MAX_PHOTO_BYTES, PHOTO_MIMES } from "./constants";
export async function preparePhoto(file: File): Promise<File> {
  if (!file.type) {
    const extension = file.name.split(".").at(-1)?.toLowerCase();
    const mime = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      heic: "image/heic",
      heif: "image/heif",
    }[extension ?? ""];
    if (mime) file = new File([file], file.name, { type: mime });
  }
  if (!PHOTO_MIMES.includes(file.type) || !file.size)
    throw new Error("INVALID_IMAGE");
  if (file.size <= MAX_PHOTO_BYTES) return file;
  if (file.type === "image/heic" || file.type === "image/heif")
    throw new Error("CHOOSE_SMALLER_HEIF");
  const bitmap = await createImageBitmap(file);
  try {
    let scale = Math.min(1, 4080 / Math.max(bitmap.width, bitmap.height));
    for (let attempt = 0; attempt < 5; attempt++) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("CANVAS_UNAVAILABLE");
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value ? resolve(value) : reject(new Error("COMPRESSION_FAILED")),
          "image/jpeg",
          0.88 - attempt * 0.06,
        ),
      );
      if (blob.size <= MAX_PHOTO_BYTES)
        return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, {
          type: "image/jpeg",
        });
      scale *= 0.8;
    }
    throw new Error("CHOOSE_SMALLER_IMAGE");
  } finally {
    bitmap.close();
  }
}
