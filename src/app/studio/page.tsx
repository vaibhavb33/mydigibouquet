import React, { Suspense } from "react";
import type { Metadata } from "next";
import { alexBrush } from "@/lib/fonts-script";
import { loraFont } from "@/lib/fonts-literary";
import { StudioShell } from "@/components/studio/StudioShell";
import {
  buildPageMetadata,
  buildWebApplicationSchema,
  serializeJsonLd,
} from "@/lib/seo";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const hasParams = Boolean(sp.preset || sp.occasion || sp.stem || sp.q);
  const baseMeta = buildPageMetadata({
    title: "Online Bouquet Maker — Interactive Floral Studio",
    description:
      "Arrange 47 realistic botanical stems stem by stem, customize wrapping papers and velvet ribbons, personalize your card, attach cropped photos or voice messages, and share privately.",
    path: "/studio",
    keywords: [
      "online bouquet maker",
      "create a digital bouquet",
      "digital flower arrangement studio",
      "virtual bouquet creator",
    ],
  });
  return {
    ...baseMeta,
    robots: hasParams
      ? {
        index: false,
        follow: true,
      }
      : baseMeta.robots,
  };
}

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; occasion?: string; stem?: string; mode?: string }>;
}) {
  const sp = await searchParams;
  const rawMode = sp.mode?.toLowerCase();
  const initialMode: "quick" | "studio" =
    rawMode === "studio" || rawMode === "advanced" || Boolean(sp.stem) ? "studio" : "quick";

  return (
    <div className={`${alexBrush.variable} ${loraFont.variable}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(buildWebApplicationSchema()),
        }}
      />
      <Suspense
        fallback={
          <div className="flex h-[100dvh] flex-col items-center justify-center gap-3 bg-[var(--bg-canvas)] text-[var(--text-secondary)]">
            <div className="h-12 w-12 animate-pulse rounded-full bg-[var(--bg-well)]" />
            <p className="text-sm font-medium">Opening Petal &amp; Prose Atelier…</p>
          </div>
        }
      >
        <StudioShell
          initialPresetSlug={sp.preset ?? null}
          initialOccasionSlug={sp.occasion ?? null}
          initialStemSlug={sp.stem ?? null}
          initialMode={initialMode}
        />
      </Suspense>
    </div>
  );
}

