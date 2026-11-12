import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATALOG_ENTRIES } from "@/generated/catalog-manifest";
import { OCCASION_TEMPLATES } from "@/engine/occasions";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { BotanicalImage } from "@/components/ui/SkeletonCard";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { buildPageMetadata } from "@/lib/seo";

const SPECIES_SLUGS = Array.from(
  new Set(CATALOG_ENTRIES.filter((c) => c.hasSpeciesPage).map((c) => c.speciesSlug)),
);

export async function generateStaticParams() {
  return SPECIES_SLUGS.map((species) => ({ species }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ species: string }>;
}): Promise<Metadata> {
  const { species } = await params;
  const match = CATALOG_ENTRIES.find((c) => c.speciesSlug === species);
  if (!match) {
    return buildPageMetadata({
      title: "Botanical Guide — Petal & Prose",
      description: "Explore digital botanical morphology and floriography meaning.",
      path: `/flowers/${species}`,
      noIndex: true,
    });
  }
  return buildPageMetadata({
    title: `${match.name} Meaning & Virtual Bouquet Stems`,
    description: `${match.meaningFull} Arrange ${match.name.toLowerCase()} stems in your custom online digital bouquet.`,
    path: `/flowers/${species}`,
    ogImage: match.studioPath,
    keywords: [
      `${match.name.toLowerCase()} meaning`,
      `${match.name.toLowerCase()} digital bouquet`,
      "virtual flowers",
      "floriography meaning",
    ],
  });
}

export default async function SpeciesPage({
  params,
}: {
  params: Promise<{ species: string }>;
}) {
  const { species } = await params;
  const variants = CATALOG_ENTRIES.filter((c) => c.speciesSlug === species);
  if (variants.length === 0) {
    notFound();
  }

  const primary = variants[0]!;
  const relatedOccasions = Array.from(
    new Set(variants.flatMap((variant) => variant.occasionTags)),
  );

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Flower Library", path: "/flowers" },
            { name: primary.name, path: `/flowers/${species}` },
          ]}
        />

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-hairline)] pb-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-primary)]">
              Species Monograph · {primary.role}
            </p>
            <h1 className="mt-1 font-display text-4xl font-medium sm:text-5xl">{primary.name}</h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              {primary.meaningFull}
            </p>
          </div>
          <Link
            href={`/studio?stem=${primary.skuId}`}
            className="inline-flex min-h-[44px] items-center rounded-full bg-[var(--accent-primary)] px-6 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)] sm:text-sm"
          >
            Start Studio With {primary.name} &rarr;
          </Link>
        </div>

        <h2 className="mt-9 font-display text-2xl font-medium sm:text-3xl">
          Available Studio Stages &amp; Orientations ({variants.length})
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {variants.map((v) => (
            <div
              key={v.skuId}
              className="flex flex-col justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 transition hover:border-[var(--accent-primary)]"
            >
              <div>
                <div className="aspect-square w-full overflow-hidden rounded-xl bg-[var(--bg-well)]/50 p-2">
                  <BotanicalImage
                    src={v.studioPath}
                    alt={`${v.name} ${v.variantLabel}`}
                    width={420}
                    height={420}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="mt-3 inline-block text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                  {v.variantLabel}
                </span>
                <h3 className="font-display text-xl font-medium">{v.colorAnchor}</h3>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{v.meaningShort}</p>
              </div>
              <Link
                href={`/studio?stem=${v.skuId}`}
                className="mt-4 inline-flex min-h-[38px] items-center justify-center rounded-full border border-[var(--border-hairline)] bg-white px-4 text-xs font-semibold text-[var(--accent-primary)] transition hover:border-[var(--accent-primary)] hover:bg-[var(--bg-canvas)]"
              >
                Use This Variant &rarr;
              </Link>
            </div>
          ))}
        </div>

        {relatedOccasions.length > 0 && (
          <section className="mt-12 rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
            <h2 className="font-display text-2xl font-medium">
              Recommended Occasion Pairings
            </h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)] sm:text-sm">
              Jump directly to curated templates featuring {primary.name}.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {relatedOccasions.map((occ) => (
                <Link
                  key={occ}
                  href={`/occasions/${occ}`}
                  className="inline-flex min-h-[38px] items-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                >
                  {OCCASION_TEMPLATES[occ]?.label ?? occ}
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
