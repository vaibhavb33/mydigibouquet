import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CANONICAL_OCCASIONS, VESSEL_RULES, type OccasionSlug } from "@/engine/types";
import { OCCASION_TEMPLATES, applyOccasionTemplateToScene } from "@/engine/occasions";
import { STARTER_BOUQUETS, buildSceneFromPreset } from "@/engine/presets";
import { CATALOG_ENTRIES, CATALOG_META_MAP } from "@/generated/catalog-manifest";
import { SITE_FAQS } from "@/lib/site-content";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { BotanicalImage } from "@/components/ui/SkeletonCard";
import { CopyStarterChip } from "@/components/ui/CopyStarterChip";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { BouquetCanvasDisplay } from "@/components/unboxing/BouquetCanvasDisplay";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { buildPageMetadata } from "@/lib/seo";

function formatTitle(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export async function generateStaticParams() {
  return CANONICAL_OCCASIONS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const isCanonical = CANONICAL_OCCASIONS.includes(slug as OccasionSlug);
  const occTemplate = OCCASION_TEMPLATES[slug as OccasionSlug];
  const label = occTemplate?.label ?? formatTitle(slug);
  return buildPageMetadata({
    title: `${label} Digital Bouquets & Virtual Flower Gift Ideas`,
    description:
      occTemplate?.tagline ??
      `Curated digital flower arrangements, bouquet templates, and virtual greeting card notes tailored for ${label.toLowerCase()}.`,
    path: `/occasions/${slug}`,
    noIndex: !isCanonical,
    keywords: [
      `${label.toLowerCase()} digital bouquet`,
      `virtual ${label.toLowerCase()} flowers`,
      "digital flower gift",
      "online bouquet maker",
    ],
  });
}

export default async function OccasionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!CANONICAL_OCCASIONS.includes(slug as OccasionSlug)) {
    notFound();
  }

  const occSlug = slug as OccasionSlug;
  const occTemplate = OCCASION_TEMPLATES[occSlug];
  const matchingPresets = STARTER_BOUQUETS.filter((p) => p.occasion === slug);
  const stems = CATALOG_ENTRIES.filter((item) => item.occasionTags.includes(occSlug));
  const label = occTemplate?.label ?? formatTitle(slug);

  const previewBase = matchingPresets[0] ?? STARTER_BOUQUETS[0]!;
  const previewScene = applyOccasionTemplateToScene(
    buildSceneFromPreset(previewBase, CATALOG_META_MAP),
    occSlug,
    "full",
    CATALOG_META_MAP,
  );

  const noteStarters = Array.from(
    new Set([
      occTemplate?.sampleMessage,
      ...matchingPresets.map((p) => p.defaultNote),
      `Thinking of you today with a hand-picked ${label.toLowerCase()} bouquet crafted to stay bright.`,
    ].filter((s): s is string => Boolean(s))),
  );

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Occasion Templates", path: "/occasions" },
            { name: label, path: `/occasions/${slug}` },
          ]}
        />

        <div className="mt-5 grid items-center gap-8 border-b border-[var(--border-hairline)] pb-10 md:grid-cols-12">
          <div className="min-w-0 space-y-4 md:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-primary)]">
              Occasion Style Guide
            </p>
            <h1 className="font-display text-4xl font-medium sm:text-5xl">{label} Bouquets</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              {occTemplate?.tagline ??
                `Start directly from a hand-composed starter bouquet below, or open a fresh canvas featuring meaningful blooms traditional for ${label.toLowerCase()}.`}
            </p>

            {occTemplate && (
              <div className="space-y-2 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--accent-primary)]">
                    Palette: {occTemplate.paletteLabel}
                  </span>
                  <div className="flex items-center gap-1">
                    {occTemplate.paletteSwatches.map((hex, i) => (
                      <span
                        key={i}
                        className="h-3.5 w-3.5 rounded-full border border-black/15"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Recommended Wrap: {VESSEL_RULES[occTemplate.vesselId].label} &bull; Silhouette:{" "}
                  {occTemplate.compositionPreset} &bull; Key Stems:{" "}
                  {occTemplate.recommendedSkuIds
                    .slice(0, 4)
                    .map((id) => CATALOG_META_MAP.get(id)?.name ?? id)
                    .join(", ")}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href={`/studio?occasion=${slug}`}
                className="inline-flex min-h-[44px] items-center rounded-full bg-[var(--accent-primary)] px-6 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)] sm:text-sm"
              >
                Launch {label} in Studio &rarr;
              </Link>
              <Link
                href="/occasions"
                className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-5 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
              >
                All Occasions
              </Link>
            </div>
          </div>

          <div className="min-w-0 md:col-span-5">
            <div className="overflow-hidden rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 shadow-sm">
              <div className="aspect-[5/6] w-full overflow-hidden rounded-2xl bg-[var(--bg-well)]">
                <BouquetCanvasDisplay scene={previewScene} width={480} height={576} />
              </div>
            </div>
          </div>
        </div>

        {/* Starter Presets */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-medium sm:text-3xl">
            Curated Starter Recipes
          </h2>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            {(matchingPresets.length > 0 ? matchingPresets : STARTER_BOUQUETS.slice(0, 2)).map(
              (preset) => {
                const scene = buildSceneFromPreset(preset, CATALOG_META_MAP);
                return (
                  <div
                    key={preset.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-xs sm:flex-row"
                  >
                    <div className="aspect-[5/6] w-full shrink-0 bg-[var(--bg-well)]/40 sm:w-52">
                      <BouquetCanvasDisplay
                        scene={scene}
                        width={420}
                        height={504}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <h3 className="font-display text-2xl font-medium">{preset.title}</h3>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          {preset.subtitle}
                        </p>
                        <p className="mt-3 text-xs italic text-[var(--text-muted)]">
                          &ldquo;{preset.defaultNote}&rdquo;
                        </p>
                      </div>
                      <Link
                        href={`/studio?preset=${preset.id}`}
                        className="mt-5 inline-flex min-h-[40px] items-center self-start rounded-full bg-[var(--accent-primary)] px-5 text-xs font-semibold text-white hover:bg-[var(--accent-primary-hover)]"
                      >
                        Customize This Bouquet &rarr;
                      </Link>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </section>

        {/* Note Starters with Copy Pills */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-medium sm:text-3xl">
            {label} Keepsake Card Message Ideas
          </h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)] sm:text-sm">
            Copy a ready starter directly into Step 4 of the Bouquet Studio.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {noteStarters.slice(0, 4).map((note) => (
              <CopyStarterChip key={note} text={note} />
            ))}
          </div>
        </section>

        {/* Recommended Stems */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-medium sm:text-3xl">
            Recommended {label} Stems ({stems.length})
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {stems.map((s) => (
              <Link
                key={s.skuId}
                href={`/studio?stem=${s.skuId}`}
                className="group flex flex-col rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3 transition hover:border-[var(--accent-primary)]"
              >
                <div className="aspect-square w-full overflow-hidden rounded-xl bg-[var(--bg-well)]/40 p-1.5">
                  <BotanicalImage
                    src={s.thumbPath}
                    alt={`${s.name} ${s.variantLabel}`}
                    width={240}
                    height={240}
                    className="h-full w-full object-contain"
                  />
                </div>
                <p className="mt-2 text-xs font-semibold group-hover:text-[var(--accent-primary)]">
                  {s.name}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">{s.variantLabel}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Frequently Asked */}
        <section className="mt-14 border-t border-[var(--border-hairline)] pt-10">
          <h2 className="font-display text-2xl font-medium sm:text-3xl">
            Studio &amp; Delivery Questions
          </h2>
          <div className="mt-5">
            <FaqAccordion items={SITE_FAQS.slice(0, 4)} />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
