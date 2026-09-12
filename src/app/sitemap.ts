import type { MetadataRoute } from "next";
import { publicKnowledgePages } from "@/lib/knowledge";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL || "http://localhost:3000";
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
    url: `${base}${route}`,
    changeFrequency: route.includes("classes") ? "daily" : "weekly",
    priority: route ? 0.7 : 1,
  }));
}
