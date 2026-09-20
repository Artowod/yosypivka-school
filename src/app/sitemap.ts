import type { MetadataRoute } from "next";
import { publicKnowledgePages } from "@/lib/knowledge";
import { SITE_URL } from "@/lib/seo";
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/history",
    "/school-life",
    "/school-life/gallery",
    "/archive",
    "/knowledge",
    ...publicKnowledgePages().map(({ group, page }) => `/knowledge/${group.id}/${page.slug}`),
    ...[1, 2, 3, 4].flatMap((id) => [
      `/classes/${id}`,
      `/classes/${id}/gallery`,
    ]),
  ];
  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: route.includes("classes") ? "daily" : "weekly",
    priority: route ? 0.7 : 1,
  }));
}
