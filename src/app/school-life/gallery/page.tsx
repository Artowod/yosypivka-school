import { Suspense } from "react";
import { PageHero } from "@/components/PageHero/PageHero";
import { PhotoGallery } from "@/components/PhotoGallery/PhotoGallery";
import { Loader } from "@/components/Loader/Loader";
import { getPhotos } from "@/lib/data";
import { logError } from "@/lib/logging";
export const revalidate = 3600;
export const metadata = {
  title: "Галерея школи",
  description:
    "Спільні шкільні події та фотографії Йосипівської початкової школи.",
  alternates: { canonical: "/school-life/gallery" },
};
export default async function SchoolGalleryPage() {
  let initialData;
  try {
    initialData = await getPhotos({ galleryId: "school", limit: 10 });
  } catch (error) {
    await logError("school.gallery", error);
    throw new Error("GALLERY_UNAVAILABLE");
  }
  return (
    <>
      <PageHero
        title="Галерея школи"
        description="Великий альбом нашої маленької школи. Збираємо спогади разом."
        eyebrow="Миті, що нас об’єднують"
        kind="camera"
      />
      <Suspense fallback={<Loader />}>
        <PhotoGallery galleryId="school" initialData={initialData} />
      </Suspense>
    </>
  );
}
