import { SCHOOL_NAME } from "@/lib/constants";
import { SITE_URL } from "@/lib/seo";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "School",
      "@id": `${SITE_URL}/#school`,
      name: SCHOOL_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      image: `${SITE_URL}/images/school-main-1.jpg`,
      description:
        "Початкова школа Брусилівської громади в селі Йосипівка Житомирської області.",
      address: {
        "@type": "PostalAddress",
        streetAddress: "вул. М. Стахівської, 35",
        addressLocality: "Йосипівка",
        addressRegion: "Житомирська область",
        addressCountry: "UA",
      },
      sameAs: ["https://www.facebook.com/yosipivska"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SCHOOL_NAME,
      inLanguage: "uk",
      publisher: { "@id": `${SITE_URL}/#school` },
    },
  ],
};

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
      }}
    />
  );
}
