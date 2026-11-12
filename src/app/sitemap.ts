import type { MetadataRoute } from "next";
import { CANONICAL_OCCASIONS } from "@/engine/types";
import { CATALOG_ENTRIES } from "@/generated/catalog-manifest";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-11-11T00:00:00.000Z");

  const staticRoutes: Array<{
    path: string;
    priority: number;
    changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
    images?: string[];
  }> = [
    {
      path: "/",
      priority: 1.0,
      changeFrequency: "weekly",
      images: [absoluteUrl("/api/og/preset-classic-romance")],
    },
    { path: "/studio", priority: 0.9, changeFrequency: "weekly" },
    { path: "/flowers", priority: 0.9, changeFrequency: "weekly" },
    { path: "/occasions", priority: 0.9, changeFrequency: "weekly" },
    { path: "/gallery", priority: 0.85, changeFrequency: "daily" },
    { path: "/blog", priority: 0.85, changeFrequency: "weekly" },
    { path: "/how-it-works", priority: 0.75, changeFrequency: "monthly" },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.75, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.4, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.4, changeFrequency: "yearly" },
  ];

  const uniqueSpecies = Array.from(
    CATALOG_ENTRIES.filter((c) => c.hasSpeciesPage).reduce((map, entry) => {
      if (!map.has(entry.speciesSlug)) map.set(entry.speciesSlug, entry);
      return map;
    }, new Map<string, (typeof CATALOG_ENTRIES)[number]>()).values(),
  );

  const speciesRoutes: MetadataRoute.Sitemap = uniqueSpecies.map((species) => ({
    url: absoluteUrl(`/flowers/${species.speciesSlug}`),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.8,
    images: [absoluteUrl(species.studioPath)],
  }));

  const occasionRoutes: MetadataRoute.Sitemap = CANONICAL_OCCASIONS.map((slug) => ({
    url: absoluteUrl(`/occasions/${slug}`),
    lastModified,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: new Date(`${post.updatedAt}T00:00:00.000Z`),
    changeFrequency: "monthly",
    priority: 0.75,
    images: [absoluteUrl(post.coverImage)],
  }));

  return [
    ...staticRoutes.map((item) => ({
      url: absoluteUrl(item.path),
      lastModified,
      changeFrequency: item.changeFrequency,
      priority: item.priority,
      images: item.images,
    })),
    ...occasionRoutes,
    ...speciesRoutes,
    ...blogRoutes,
  ];
}

