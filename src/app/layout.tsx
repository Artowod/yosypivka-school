import { PageContent } from "@/components/PageContent/PageContent";
import { ScrollToTop } from "@/components/ScrollToTop/ScrollToTop";
import { ScenicBackground } from "@/components/ScenicBackground/ScenicBackground";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { SchoolHeader } from "@/components/SchoolHeader/SchoolHeader";
import { SchoolFooter } from "@/components/SchoolFooter/SchoolFooter";
import { Providers } from "@/components/Providers/Providers";
import { StructuredData } from "@/components/StructuredData/StructuredData";
import { SCHOOL_NAME } from "@/lib/constants";
import { DEFAULT_SOCIAL_IMAGE, SITE_URL } from "@/lib/seo";
import "./globals.scss";
const nunito = localFont({
  src: "../../public/fonts/Nunito.ttf",
  variable: "--font-nunito",
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SCHOOL_NAME,
  category: "education",
  keywords: [
    "Йосипівська початкова школа",
    "школа Йосипівка",
    "Брусилівська громада",
    "початкова школа Житомирщина",
  ],
  title: {
    default: `${SCHOOL_NAME} — маленька школа, великі мрії`,
    template: `%s | ${SCHOOL_NAME}`,
  },
  description:
    "Йосипівська початкова школа Брусилівської громади: наші класи, розклад занять, шкільне життя та історія рідного села.",
  openGraph: {
    locale: "uk_UA",
    type: "website",
    siteName: SCHOOL_NAME,
    title: SCHOOL_NAME,
    description: "Зростаємо разом. З любов’ю до України.",
    url: "/",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SCHOOL_NAME,
    description: "Зростаємо разом. З любов’ю до України.",
    images: [DEFAULT_SOCIAL_IMAGE.url],
  },
  alternates: { languages: { uk: "/" } },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body className={nunito.variable}>
        <StructuredData />
        <ScenicBackground />
        <Providers>
          <a className="skipLink" href="#main-content">
            Перейти до змісту
          </a>
          <SchoolHeader />
          <PageContent>{children}</PageContent>
          <SchoolFooter />
          <ScrollToTop />
        </Providers>
      </body>
    </html>
  );
}
