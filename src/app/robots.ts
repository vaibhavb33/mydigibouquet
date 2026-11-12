import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/b/", "/api/og/"],
        disallow: [
          "/api/projects/",
          "/api/media/",
          "/api/contact/",
          "/api/assistant/",
          "/api/bouquets/",
          "/receipt/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

