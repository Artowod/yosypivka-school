import type { Metadata } from "next";
import { SCHOOL_NAME } from "@/lib/constants";

export const SITE_URL = (process.env.SITE_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

export const DEFAULT_SOCIAL_IMAGE = {
  url: "/images/school-main-1.jpg",
  width: 1600,
  height: 900,
  alt: "Йосипівська початкова школа в селі Йосипівка",
};

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  image?: typeof DEFAULT_SOCIAL_IMAGE;
};

/** Builds consistent search and social metadata for every public page. */
export function createPageMetadata({
  title,
  description,
  path,
  image = DEFAULT_SOCIAL_IMAGE,
}: PageMetadataOptions): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: { uk: path },
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SCHOOL_NAME,
      locale: "uk_UA",
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}
