import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CLASS_IDS, type GalleryId } from "@/lib/constants";
import { getPhotos } from "@/lib/data";
import { logError } from "@/lib/logging";
import { PageHero } from "@/components/PageHero/PageHero";
import { PhotoGallery } from "@/components/PhotoGallery/PhotoGallery";
import { Loader } from "@/components/Loader/Loader";
export const revalidate = 3600;
export function generateStaticParams() {
  return CLASS_IDS.map((id) => ({ classId: String(id) }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  return {
    title: `Галерея ${classId} класу`,
    description: `Світлини та спогади ${classId} класу Йосипівської початкової школи.`,
    alternates: { canonical: `/classes/${classId}/gallery` },
  };
}
export default async function GalleryPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  if (!["1", "2", "3", "4"].includes(classId)) notFound();
  const galleryId = `class_${classId}` as GalleryId;
  let initialData;
  try {
    initialData = await getPhotos({ galleryId, limit: 10 });
  } catch (error) {
    await logError("gallery.initial", error);
    throw new Error("GALLERY_UNAVAILABLE");
  }
  return (
    <>
      <PageHero
        title={`Галерея ${classId} класу`}
        description="Маленькі миті, які хочеться зберегти. Натисніть на світлину, щоб роздивитися ближче."
        eyebrow="Наші кольорові спогади"
        kind="camera"
        mood="pink"
      />
      <Suspense fallback={<Loader />}>
        <PhotoGallery galleryId={galleryId} initialData={initialData} />
      </Suspense>
    </>
  );
}
