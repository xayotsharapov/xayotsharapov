import type { MetadataRoute } from "next";
import { getAllPublished, getCategories } from "@/lib/posts";
import { siteUrl } from "@/lib/site";

export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [posts, categories] = await Promise.all([
    getAllPublished().catch(() => []),
    getCategories().catch(() => []),
  ]);
  const latest = posts[0]?.updated_at;
  return [
    { url: `${base}/`, lastModified: latest, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/blog`, lastModified: latest, changeFrequency: "weekly", priority: 0.9 },
    ...categories.map((c) => ({
      url: `${base}/blog?category=${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
