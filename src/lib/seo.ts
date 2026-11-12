import type { Metadata } from "next";
import type { FaqItem } from "@/lib/site-content";
import type { BlogPostSpec } from "@/lib/blog-posts";

const DEFAULT_PROD_URL = "https://mydigibouquet.com";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return DEFAULT_PROD_URL;
  return raw.replace(/\/+$/, "");
}

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/" ? base : `${base}${normalized}`;
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function buildPageMetadata({
  title,
  description,
  path,
  keywords,
  ogImage = "/api/og/preset-classic-romance",
  type = "website",
  noIndex = false,
  titleAbsolute = false,
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  ogImage?: string;
  type?: "website" | "article";
  noIndex?: boolean;
  titleAbsolute?: boolean;
}): Metadata {
  const canonicalUrl = absoluteUrl(path);
  const fullImage = ogImage.startsWith("http") ? ogImage : absoluteUrl(ogImage);

  return {
    title: titleAbsolute ? { absolute: title } : title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Petal & Prose",
      type,
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: `${title} — Petal & Prose Digital Floral Atelier`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [fullImage],
    },
  };
}

export function buildOrganizationSchema() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Petal & Prose",
    url: siteUrl,
    logo: `${siteUrl}/api/og/preset-classic-romance`,
    description:
      "Free bespoke digital flower bouquet atelier for arranging lifelike blooms stem by stem with artisan wraps, ribbons, handwritten cards, cropped photos, and voice notes.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${siteUrl}/contact`,
      availableLanguage: ["English"],
    },
  };
}

export function buildWebsiteSchema() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Petal & Prose",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/flowers?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildWebApplicationSchema() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Petal & Prose Bouquet Studio",
    url: `${siteUrl}/studio`,
    applicationCategory: "DesignApplication",
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript and HTML5 Canvas",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "40 morphological botanical stems with buds, angled blooms, and greenery",
      "Kraft, linen, textured weave, cellophane wraps & satin/silk/velvet ribbons",
      "Handwritten stationery card customization with cropped photos & voice message",
      "Private noindex gift links and high-resolution PNG/JPG exports",
    ],
  };
}

export function buildBreadcrumbSchema(
  items: ReadonlyArray<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildArticleSchema(post: BlogPostSpec) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Organization",
      name: "Petal & Prose Editorial Studio",
      url: `${siteUrl}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: "Petal & Prose",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/api/og/preset-classic-romance`,
      },
    },
    image: absoluteUrl(post.coverImage),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(`/blog/${post.slug}`),
    },
    articleSection: post.category,
  };
}

export function buildFaqSchema(items: readonly FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
