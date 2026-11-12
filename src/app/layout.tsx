import type { Metadata } from "next";
import { cormorantGaramond, plusJakartaSans } from "@/lib/fonts-base";
import {
  absoluteUrl,
  buildOrganizationSchema,
  buildWebsiteSchema,
  getSiteUrl,
  serializeJsonLd,
} from "@/lib/seo";
import "./globals.css";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Petal & Prose — Create a Personalized Digital Bouquet Online",
    template: "%s | Petal & Prose",
  },
  description:
    "Compose lifelike bespoke digital flower bouquets stem by stem, wrap in artisan paper & glass vases, seal a personalized keepsake card, and share instantly.",
  openGraph: {
    title: "Petal & Prose — Create a Personalized Digital Bouquet Online",
    description:
      "Compose lifelike bespoke digital flower bouquets stem by stem, wrap in artisan paper & glass vases, seal a personalized keepsake card, and share instantly.",
    url: siteUrl,
    siteName: "Petal & Prose",
    type: "website",
    images: [
      {
        url: absoluteUrl("/api/og/preset-classic-romance"),
        width: 1200,
        height: 630,
        alt: "Petal & Prose — Bespoke Digital Flower Bouquet Atelier",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Petal & Prose — Create a Personalized Digital Bouquet Online",
    description:
      "Compose lifelike bespoke digital flower bouquets stem by stem, wrap in artisan paper & glass vases, and share privately.",
    images: [absoluteUrl("/api/og/preset-classic-romance")],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorantGaramond.variable} ${plusJakartaSans.variable}`}>
      <body className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(buildOrganizationSchema()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(buildWebsiteSchema()),
          }}
        />
        {children}
      </body>
    </html>
  );
}

