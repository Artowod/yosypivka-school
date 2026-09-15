import type { Photo } from "./demo";
export function photoUrl(photo: Photo, large = false) {
  if (photo.secureUrl.startsWith("/images/")) return photo.secureUrl;
  // Always deliver transformed copies; never expose GPS/EXIF-bearing originals.
  return photo.secureUrl.replace(
    "/image/upload/",
    `/image/upload/c_limit,w_${large ? 2400 : 480},q_auto,f_auto,fl_strip_profile/`,
  );
}
export function originalDownloadUrl(photo: Photo) {
  if (photo.secureUrl.startsWith("/images/")) return photo.secureUrl;
  // Cloudinary's attachment flag downloads the stored asset, not a resized preview.
  return photo.secureUrl.replace(
    "/image/upload/",
    "/image/upload/fl_attachment/",
  );
}
