import type { Metadata } from "next";
import Link from "next/link";
import { CANONICAL_OCCASIONS, VESSEL_RULES } from "@/engine/types";
import {
  CORE_ELEVEN_OCCASIONS,
  OCCASION_TEMPLATES,
  applyOccasionTemplateToScene,
} from "@/engine/occasions";
import { COMPOSITION_PRESET_LABELS, STARTER_BOUQUETS, buildSceneFromPreset } from "@/engine/presets";
import { CATALOG_META_MAP } from "@/generated/catalog-manifest";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { BouquetCanvasDisplay } from "@/components/unboxing/BouquetCanvasDisplay";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Occasion Digital Bouquet Templates — Birthday, Anniversary & Wedding",
  description:
    "Explore curated floral occasion templates with tailored flower palettes, wrapping styles, ribbons, and ready-to-customize virtual greeting card tones.",
  path: "/occasions",
  keywords: [
    "online birthday bouquet",
    "anniversary digital bouquet",
    "virtual greeting cards",
    "occasion bouquet templates",
    "personalized digital bouquet",
  ],
});

function formatOccasionLabel(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function OccasionsIndexPage() {
  const defaultPreset = STARTER_BOUQUETS[0]!;
  const coreCards = CORE_ELEVEN_OCCASIONS.map((tmpl) => {
    const matchedPreset = STARTER_BOUQUETS.find((p) => p.occasion === tmpl.slug) ?? defaultPreset;
    const baseScene = buildSceneFromPreset(matchedPreset, CATALOG_META_MAP);
    const tailoredScene = applyOccasionTemplateToScene(baseScene, tmpl.slug, "full", CATALOG_META_MAP);
    return { tmpl, scene: tailoredScene };
  });

  const coreSlugSet = new Set(CORE_ELEVEN_OCCASIONS.map((item) => item.slug));
  const extraOccasions = CANONICAL_OCCASIONS.filter((o) => !coreSlugSet.has(o));

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Occasion Templates", path: "/occasions" },
          ]}
          className="mb-5"
        />
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-hairline)] pb-8">
          <div className="max-w-2xl space-y-2.5">
            <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-primary)]">
              Occasion-Based Style Guides
            </p>
            <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">
              Curated Occasion Bouquet Templates
            </h1>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              Every occasion template recommends balanced stems, wrapping paper or glass vessel,
              ribbon texture, wax seal color, and card stationery tone. Open any template in the
              Studio and adjust any individual flower freely.
            </p>
          </div>
          <Link
            href="/studio"
            className="inline-flex min-h-[44px] items-center rounded-full bg-[var(--accent-primary)] px-6 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)] sm:text-sm"
          >
            Start Blank Canvas &rarr;
          </Link>
        </div>

        <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="11 core occasion templates">
          {coreCards.map(({ tmpl, scene }) => (
            <article
              key={tmpl.slug}
              className="flex flex-col overflow-hidden rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Link
                href={`/occasions/${tmpl.slug}`}
                className="block aspect-[5/6] w-full overflow-hidden rounded-2xl bg-[var(--bg-well)]"
              >
                <BouquetCanvasDisplay scene={scene} width={440} height={528} />
              </Link>

              <div className="mt-4 flex flex-1 flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                      {COMPOSITION_PRESET_LABELS[tmpl.compositionPreset].label}
                    </span>
                    <div className="flex items-center gap-1" aria-hidden="true">
                      {tmpl.paletteSwatches.slice(0, 4).map((hex, i) => (
                        <span
                          key={i}
                          className="h-3 w-3 rounded-full border border-black/15"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>
                  <h2 className="mt-1 font-display text-2xl font-medium text-[var(--text-primary)]">
                    {tmpl.label}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                    {tmpl.tagline}
                  </p>
                  <p className="mt-2.5 rounded-xl bg-[var(--bg-canvas)] px-3 py-2 text-[11px] italic text-[var(--text-muted)]">
                    &ldquo;{tmpl.sampleMessage}&rdquo;
                  </p>
                  <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                    Wrap: {VESSEL_RULES[tmpl.vesselId].label}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/studio?occasion=${tmpl.slug}`}
                    className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-full bg-[var(--accent-primary)] px-4 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)]"
                  >
                    Use This Style
                  </Link>
                  <Link
                    href={`/occasions/${tmpl.slug}`}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                  >
                    Guide &amp; Stems
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>

        {extraOccasions.length > 0 && (
          <section className="mt-12 rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
            <h2 className="font-display text-2xl font-medium">Additional Sentiment Collections</h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)] sm:text-sm">
              Dedicated palettes for seasonal celebrations, comfort gestures, and everyday notes.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {extraOccasions.map((slug) => (
                <Link
                  key={slug}
                  href={`/occasions/${slug}`}
                  className="inline-flex min-h-[40px] items-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                >
                  {OCCASION_TEMPLATES[slug]?.label ?? formatOccasionLabel(slug)} &rarr;
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
