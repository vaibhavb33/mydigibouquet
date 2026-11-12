import type { Metadata } from "next";
import Link from "next/link";
import { getRecentGalleryBouquets } from "@/db";
import type { BouquetSceneV1 } from "@/engine/types";
import { STARTER_BOUQUETS } from "@/engine/presets";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { GalleryExplorer, type GalleryItemView } from "@/components/ui/GalleryExplorer";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Digital Bouquet Gallery — Curated & Showcase Arrangements",
  description:
    "Explore bespoke digital bouquets crafted inside the Petal & Prose studio. Unbox animated arrangements or customize any silhouette in the online bouquet maker.",
  path: "/gallery",
  keywords: [
    "digital bouquet gallery",
    "virtual flower bouquet ideas",
    "online flower arrangement templates",
    "bouquet inspiration",
  ],
});

export default async function GalleryPage() {
  const rows = await getRecentGalleryBouquets(18);
  const items: GalleryItemView[] = rows.flatMap((row) => {
    try {
      const scene = JSON.parse(row.sceneJson) as BouquetSceneV1;
      const preset = STARTER_BOUQUETS.find((p) => `preset-${p.id}` === row.slug);
      return [
        {
          slug: row.slug,
          title: row.title,
          occasionTag: row.occasionTag,
          scene,
          presetId: preset?.id ?? null,
        },
      ];
    } catch {
      return [];
    }
  });

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Bouquet Gallery", path: "/gallery" },
          ]}
          className="mb-5"
        />
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-hairline)] pb-8">
          <div className="max-w-2xl space-y-2.5">
            <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-primary)]">
              Curated &amp; Showcase Creations
            </p>
            <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">
              Atelier Bouquet Gallery
            </h1>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              Open any keepsake bouquet to experience its animated envelope reveal and botanical
              legend, or launch its aesthetic directly in the Composition Studio.
            </p>
          </div>
          <Link
            href="/studio"
            className="inline-flex min-h-[44px] items-center rounded-full bg-[var(--accent-primary)] px-6 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)] sm:text-sm"
          >
            Create Your Own &rarr;
          </Link>
        </div>

        <section className="mt-8" aria-label="Bouquet gallery listings">
          {items.length > 0 ? (
            <GalleryExplorer items={items} />
          ) : (
            <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-10 text-center">
              <p className="font-display text-2xl font-medium">Gallery is waking up</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Jump straight into the Composition Studio to arrange the first bouquet.
              </p>
              <Link
                href="/studio"
                className="mt-5 inline-flex min-h-[42px] items-center rounded-full bg-[var(--accent-primary)] px-6 text-xs font-semibold text-white"
              >
                Open Studio
              </Link>
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
