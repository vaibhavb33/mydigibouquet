import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { PLATFORM_PILLARS } from "@/lib/site-content";
import { STARTER_BOUQUETS, buildSceneFromPreset } from "@/engine/presets";
import { CATALOG_META_MAP } from "@/generated/catalog-manifest";
import { BouquetCanvasDisplay } from "@/components/unboxing/BouquetCanvasDisplay";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "About Our Digital Floral Atelier",
  description:
    "Discover the craft philosophy, botanical layering architecture, privacy commitment, and authentic floral engineering behind Petal & Prose.",
  path: "/about",
});

export default function AboutPage() {
  const showcaseScene = buildSceneFromPreset(STARTER_BOUQUETS[0]!, CATALOG_META_MAP);

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "About Us", path: "/about" },
          ]}
          className="mb-5"
        />
        <section className="grid items-center gap-10 border-b border-[var(--border-hairline)] pb-12 md:grid-cols-12">
          <div className="min-w-0 space-y-5 md:col-span-7">
            <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-primary)]">
              About Our Atelier
            </p>
            <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">
              Bringing Physical Floristry Craft to Digital Gifting
            </h1>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              Most online bouquet builders reduce flowers into tiny pixelated stamps surrounded by
              distracting ads. Petal &amp; Prose was built as a tranquil, gallery-inspired online
              floral design studio where buds, angled petals, arching foliage, folded linen wraps,
              and velvet ribbons interact with genuine spatial depth.
            </p>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              Whether you arrange every stem manually on our interactive canvas, start from an
              occasion recipe, or ask our AI Atelier Florist for a curated arrangement you can still
              fine-tune stem by stem, the gift remains unmistakably yours.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/studio"
                className="inline-flex min-h-[44px] items-center rounded-full bg-[var(--accent-primary)] px-6 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)] sm:text-sm"
              >
                Open Composition Studio
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-5 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)] sm:text-sm"
              >
                See How It Works
              </Link>
            </div>
          </div>

          <div className="min-w-0 md:col-span-5">
            <div className="overflow-hidden rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 shadow-sm">
              <div className="aspect-[5/6] w-full overflow-hidden rounded-2xl bg-[var(--bg-well)]">
                <BouquetCanvasDisplay scene={showcaseScene} width={480} height={576} includeColophon />
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <h2 className="font-display text-3xl font-medium">Four Pillars of the Studio</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PLATFORM_PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                  {pillar.eyebrow}
                </p>
                <h3 className="mt-1.5 font-display text-xl font-medium">{pillar.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                  {pillar.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 sm:p-8 md:grid-cols-2">
          <div className="space-y-3">
            <h2 className="font-display text-2xl font-medium sm:text-3xl">
              Zero Fake Reviews. Clear Craft Transparency.
            </h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              You will never see fabricated testimonial carousels or placeholder user ratings here.
              When genuine senders share stories with permission, we publish them transparently;
              until then, our specimen library, starter compositions, and live studio speak for
              themselves.
            </p>
          </div>
          <div className="space-y-3">
            <h2 className="font-display text-2xl font-medium sm:text-3xl">
              Calm, Private &amp; Accessible by Default
            </h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Recipient links remain unlisted from search crawlers, optional name-hiding shields
              chat previews, animation loops honor prefers-reduced-motion, and every step meets
              high-contrast readability thresholds on phone and desktop screens alike.
            </p>
            <div className="pt-1">
              <Link
                href="/privacy"
                className="text-xs font-semibold text-[var(--accent-primary)] underline underline-offset-4"
              >
                Read Privacy Architecture &rarr;
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

