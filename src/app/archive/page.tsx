import { Suspense } from "react";
import { PageHero } from "@/components/PageHero/PageHero";
import { PhotoGallery } from "@/components/PhotoGallery/PhotoGallery";
import { Loader } from "@/components/Loader/Loader";
import { getPhotos } from "@/lib/data";
import { logError } from "@/lib/logging";
import { createPageMetadata } from "@/lib/seo";
export const revalidate = 3600;
export const metadata = createPageMetadata({
  title: "Фотоархів",
  description:
    "Спогади Йосипівської початкової школи: фотографії за роками, місяцями та класами.",
  path: "/archive",
});
export default async function ArchivePage() {
  let initialData;
  try {
    initialData = await getPhotos({ limit: 10 });
  } catch (error) {
    await logError("archive.initial", error);
    throw new Error("ARCHIVE_UNAVAILABLE");
  }
  return (
    <>
      <PageHero
        title="Фотоархів"
        description="Шкільні роки складаються з митей. Тут зберігаємо їх, щоб знову і знову повертатися до найтеплішого."
        eyebrow="Наша скарбничка спогадів"
        kind="archive"
        mood="green"
      />
      <Suspense fallback={<Loader />}>
        <PhotoGallery archive initialData={initialData} />
      </Suspense>
    </>
  );
}
