import type { Metadata } from "next";
import Link from "next/link";
import { CATALOG_ENTRIES } from "@/generated/catalog-manifest";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { FlowerLibraryExplorer } from "@/components/ui/FlowerLibraryExplorer";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Virtual Flower Library — 40 Botanical Stems, Greenery & Fillers",
  description:
    "Explore all 40 transparent studio botanicals: roses, peonies, tilted tulips, orchids, chamomile, baby's breath, silver eucalyptus, olive branches, Monstera foliage, and pressed petals.",
  path: "/flowers",
  keywords: [
    "virtual flowers",
    "digital flower library",
    "flower symbolism meanings",
    "botanical stems",
  ],
});

export default async function FlowersIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const initialQuery = typeof sp.q === "string" ? sp.q : "";
  const speciesPages = Array.from(
    CATALOG_ENTRIES.filter((c) => c.hasSpeciesPage).reduce((map, entry) => {
      if (!map.has(entry.speciesSlug)) map.set(entry.speciesSlug, entry);
      return map;
    }, new Map<string, (typeof CATALOG_ENTRIES)[number]>()).values(),
  );

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Flower Library", path: "/flowers" },
          ]}
          className="mb-5"
        />
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-hairline)] pb-8">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-primary)]">
              Studio Specimen Index · {CATALOG_ENTRIES.length} Stems
            </p>
            <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">
              Botanical Flower &amp; Greenery Library
            </h1>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              Browse open blooms, half-open buds, directional profiles, baby&apos;s breath,
              eucalyptus, ruscus, olive branches, and pressed petals. Click any stem to inspect
              symbolism or launch it straight into the Composition Studio.
            </p>
          </div>
          <Link
            href="/studio"
            className="inline-flex min-h-[44px] items-center rounded-full bg-[var(--accent-primary)] px-6 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)] sm:text-sm"
          >
            Open Bouquet Studio &rarr;
          </Link>
        </div>

        <section className="mt-8" aria-label="Interactive flower catalog">
          <FlowerLibraryExplorer entries={CATALOG_ENTRIES} initialQuery={initialQuery} />
        </section>

        <section className="mt-14 border-t border-[var(--border-hairline)] pt-10">
          <h2 className="font-display text-2xl font-medium sm:text-3xl">
            Detailed Species &amp; Meaning Guides
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Jump into morphological notes, stage variations, and pairing suggestions by flower
            family.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {speciesPages.map((species) => (
              <Link
                key={species.speciesSlug}
                href={`/flowers/${species.speciesSlug}`}
                className="inline-flex min-h-[40px] items-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
              >
                {species.name} &rarr;
              </Link>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

