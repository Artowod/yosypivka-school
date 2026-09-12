import { PageContent } from "@/components/PageContent/PageContent";
import { ScrollToTop } from "@/components/ScrollToTop/ScrollToTop";
import { ScenicBackground } from "@/components/ScenicBackground/ScenicBackground";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { SchoolHeader } from "@/components/SchoolHeader/SchoolHeader";
import { SchoolFooter } from "@/components/SchoolFooter/SchoolFooter";
import { Providers } from "@/components/Providers/Providers";
import { SCHOOL_NAME } from "@/lib/constants";
import "./globals.scss";
const nunito = localFont({
  src: "../../public/fonts/Nunito.ttf",
  variable: "--font-nunito",
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
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
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body className={nunito.variable}>
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
