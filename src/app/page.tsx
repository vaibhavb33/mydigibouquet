import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { CANONICAL_OCCASIONS } from "@/engine/types";
import {
  CORE_ELEVEN_OCCASIONS,
  OCCASION_TEMPLATES,
  applyOccasionTemplateToScene,
} from "@/engine/occasions";
import { COMPOSITION_PRESET_LABELS, STARTER_BOUQUETS, buildSceneFromPreset } from "@/engine/presets";
import { CATALOG_ENTRIES, CATALOG_META_MAP } from "@/generated/catalog-manifest";
import {
  FEATURED_SIX_OCCASIONS,
  HOW_IT_WORKS_STEPS,
  PLATFORM_PILLARS,
  SITE_FAQS,
} from "@/lib/site-content";
import { BouquetCanvasDisplay } from "@/components/unboxing/BouquetCanvasDisplay";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { FlowerLibraryExplorer } from "@/components/ui/FlowerLibraryExplorer";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Petal & Prose — Create a Personalized Digital Bouquet Online",
  titleAbsolute: true,
  description:
    "Create a bespoke digital flower bouquet online—free. Arrange 40 realistic botanical stems with linen wraps, velvet ribbons, handwritten cards, cropped photos, and voice messages.",
  path: "/",
  keywords: [
    "digital bouquet",
    "create a digital bouquet",
    "virtual flower bouquet",
    "online bouquet maker",
    "virtual flowers",
    "digital flower gift",
    "online flower arrangement",
    "personalized digital bouquet",
    "virtual greeting cards",
    "online birthday bouquet",
  ],
});

function formatOccasionLabel(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function HomePage() {
  const heroPreset = STARTER_BOUQUETS[0]!;
  const heroScene = buildSceneFromPreset(heroPreset, CATALOG_META_MAP);
  const coreOccasionSlugSet = new Set(CORE_ELEVEN_OCCASIONS.map((item) => item.slug));

  const featuredOccasionCards = FEATURED_SIX_OCCASIONS.map((item) => {
    const tmpl = OCCASION_TEMPLATES[item.slug];
    const basePreset =
      STARTER_BOUQUETS.find((p) => p.occasion === item.slug) ?? heroPreset;
    const presetScene = buildSceneFromPreset(basePreset, CATALOG_META_MAP);
    const tailoredScene = applyOccasionTemplateToScene(
      presetScene,
      item.slug,
      "full",
      CATALOG_META_MAP,
    );
    return {
      ...item,
      scene: tailoredScene,
      paletteHexes: tmpl.paletteSwatches,
    };
  });

  const featuredTemplates = STARTER_BOUQUETS.slice(0, 4).map((preset) => ({
    preset,
    scene: buildSceneFromPreset(preset, CATALOG_META_MAP),
  }));

  const uniqueSpecies = Array.from(
    CATALOG_ENTRIES.filter((c) => c.hasSpeciesPage).reduce((map, entry) => {
      if (!map.has(entry.speciesSlug)) map.set(entry.speciesSlug, entry);
      return map;
    }, new Map<string, (typeof CATALOG_ENTRIES)[number]>()).values(),
  );

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <SiteHeader />

      {/* 1. Editorial Split Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 md:grid-cols-12 md:py-16 lg:px-8">
        <div className="min-w-0 space-y-6 md:col-span-6">
          <p className="inline-block rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-1 text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)]">
            Bespoke Digital Floral Atelier
          </p>
          <h1 className="font-display text-4xl leading-[1.06] font-medium tracking-tight sm:text-5xl lg:text-6xl">
            Send a Living Arrangement Crafted Stem by Stem.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
            Compose realistic digital bouquets from 40 botanical SKUs—closed buds, half-open blooms,
            tilted tulips, monstera leaves, and silky greenery. Style wraps and ribbons, seal a
            handwritten card with cropped keepsake photos and voice messages, and share via private link.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/studio"
              data-testid="hero-create-btn"
              className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-[var(--accent-primary)] px-7 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent-primary-hover)]"
            >
              Create Your Bouquet
            </Link>
            <Link
              href="/gallery"
              data-testid="hero-gallery-btn"
              className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-6 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)]"
            >
              Explore Gallery
            </Link>
          </div>
          <dl className="grid grid-cols-3 gap-4 border-t border-[var(--border-hairline)] pt-6 text-xs text-[var(--text-secondary)]">
            <div>
              <dt className="font-display text-2xl font-medium text-[var(--text-primary)]">40</dt>
              <dd>Morphological stem assets</dd>
            </div>
            <div>
              <dt className="font-display text-2xl font-medium text-[var(--text-primary)]">7</dt>
              <dd>Florist composition shapes</dd>
            </div>
            <div>
              <dt className="font-display text-2xl font-medium text-[var(--text-primary)]">11+</dt>
              <dd>Curated occasion suites</dd>
            </div>
          </dl>
        </div>

        <div className="min-w-0 md:col-span-6">
          <div className="relative overflow-hidden rounded-[28px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 shadow-md sm:p-6">
            <div className="aspect-[5/6] w-full overflow-hidden rounded-[20px] bg-[var(--bg-well)]">
              <BouquetCanvasDisplay scene={heroScene} width={760} height={912} includeColophon />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
              <span className="font-medium text-[var(--text-primary)]">{heroPreset.title}</span>
              <span>{heroScene.stems.length} layered botanical stems · Blush Linen Wrap</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Bouquets (Romantic, Birthday, Wedding, Friendship, Thank You, Congratulations) */}
      <section
        id="featured-bouquets"
        className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] py-14 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-primary)]">
                Featured Bouquets
              </p>
              <h2 className="mt-1 font-display text-3xl font-medium sm:text-4xl">
                Curated for Every Moment Worth Keeping
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
                Explore six signature moods—each pairing authentic blooms, wrapping paper, ribbon
                finish, and keepsake card styling.
              </p>
            </div>
            <Link
              href="/occasions"
              className="inline-flex min-h-[40px] items-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
            >
              View All Occasions &rarr;
            </Link>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredOccasionCards.map((card) => (
              <article
                key={card.slug}
                data-testid={`featured-occasion-${card.slug}`}
                className="flex flex-col overflow-hidden rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-[5/6] w-full overflow-hidden rounded-2xl bg-[var(--bg-well)]">
                  <BouquetCanvasDisplay scene={card.scene} width={440} height={528} />
                </div>
                <div className="mt-4 flex flex-1 flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--accent-primary)]">
                        {card.badge}
                      </span>
                      <div className="flex items-center gap-1" aria-hidden="true">
                        {card.paletteHexes.slice(0, 3).map((hex) => (
                          <span
                            key={hex}
                            className="h-3 w-3 rounded-full border border-black/15"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                    </div>
                    <h3 className="mt-1 font-display text-2xl font-medium text-[var(--text-primary)]">
                      {card.headline}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                      {card.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/studio?occasion=${card.slug}`}
                      className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-full bg-[var(--accent-primary)] px-4 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)]"
                    >
                      Customize in Studio
                    </Link>
                    <Link
                      href={`/occasions/${card.slug}`}
                      className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                    >
                      Template Guide
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Flower Collection with Live Category & Color Filter */}
      <section id="flowers" className="border-t border-[var(--border-hairline)] py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-primary)]">
                Botanical Specimen Library
              </p>
              <h2 className="mt-1 font-display text-3xl font-medium sm:text-4xl">
                Sculpted Buds, Open Blooms &amp; Trailing Greenery
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
                Filter across focal blooms, fillers, eucalyptus, olive branches, Monstera foliage,
                and pressed petals—or open species guides.
              </p>
            </div>
            <Link
              href="/flowers"
              className="inline-flex min-h-[40px] items-center rounded-full bg-[var(--accent-primary)] px-5 text-xs font-semibold text-white hover:bg-[var(--accent-primary-hover)]"
            >
              Open Full 40-Stem Library &rarr;
            </Link>
          </div>

          <div className="mt-7">
            <FlowerLibraryExplorer entries={CATALOG_ENTRIES} compactMode />
          </div>

          <div className="mt-8 flex flex-wrap gap-2 border-t border-[var(--border-hairline)] pt-6">
            <span className="self-center text-xs font-medium text-[var(--text-muted)]">
              Species guides:
            </span>
            {uniqueSpecies.map((species) => (
              <Link
                key={species.speciesSlug}
                href={`/flowers/${species.speciesSlug}`}
                className="inline-flex min-h-[36px] items-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
              >
                {species.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. How It Works (4 Steps) */}
      <section
        id="how-it-works"
        className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] py-14 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-primary)]">
                How It Works
              </p>
              <h2 className="mt-1 font-display text-3xl font-medium sm:text-4xl">
                From First Stem to Private Wax-Sealed Reveal
              </h2>
            </div>
            <Link
              href="/how-it-works"
              className="text-xs font-semibold text-[var(--accent-primary)] underline-offset-4 hover:underline"
            >
              Explore Full Walkthrough &rarr;
            </Link>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <div
                key={step.step}
                className="flex flex-col rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-6"
              >
                <span className="font-display text-3xl font-medium text-[var(--accent-primary)]">
                  {step.step}
                </span>
                <h3 className="mt-2 font-display text-xl font-medium text-[var(--text-primary)]">
                  {step.title}
                </h3>
                <p className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">
                  {step.summary}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                  {step.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Featured Bouquet Templates & Composition Silhouettes */}
      <section id="templates" className="border-t border-[var(--border-hairline)] py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-primary)]">
                Signature Silhouettes
              </p>
              <h2 className="mt-1 font-display text-3xl font-medium sm:text-4xl">
                Start With an Editorial Florist Composition
              </h2>
            </div>
            <Link
              href="/gallery"
              className="text-xs font-semibold text-[var(--accent-primary)] underline-offset-4 hover:underline"
            >
              Browse Full Gallery &rarr;
            </Link>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredTemplates.map(({ preset, scene }) => (
              <Link
                key={preset.id}
                href={`/studio?preset=${preset.id}`}
                className="group flex flex-col overflow-hidden rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-[5/6] w-full overflow-hidden rounded-2xl bg-[var(--bg-well)]">
                  <BouquetCanvasDisplay scene={scene} width={400} height={480} />
                </div>
                <div className="mt-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-medium uppercase tracking-wide text-[var(--accent-primary)]">
                    <span>{COMPOSITION_PRESET_LABELS[preset.compositionPreset].label}</span>
                    <span className="text-[var(--text-muted)]">{scene.stems.length} stems</span>
                  </div>
                  <h3 className="font-display text-xl font-medium group-hover:text-[var(--accent-primary)]">
                    {preset.title}
                  </h3>
                  <p className="line-clamp-2 text-xs text-[var(--text-secondary)]">
                    {preset.subtitle}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Why Choose Petal & Prose + Authenticity Note */}
      <section className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] py-14 sm:py-16">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-primary)]">
              Why Choose This Platform
            </p>
            <h2 className="mt-1 font-display text-3xl font-medium sm:text-4xl">
              Crafted Like a Real Floral Tabletop, Not a Cluttered Template Site
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {PLATFORM_PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-6"
              >
                <p className="text-[11px] font-semibold tracking-wider uppercase text-[var(--accent-primary)]">
                  {pillar.eyebrow}
                </p>
                <h3 className="mt-1.5 font-display text-xl font-medium">{pillar.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                  {pillar.body}
                </p>
              </div>
            ))}
          </div>

          {/* Genuine Testimonials Policy Banner (no fabricated reviews) */}
          <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-well)]/70 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8">
            <div className="max-w-2xl space-y-1.5">
              <p className="text-[11px] font-semibold tracking-widest uppercase text-[var(--accent-primary)]">
                Our Craft &amp; Authenticity Pledge
              </p>
              <h3 className="font-display text-2xl font-medium text-[var(--text-primary)]">
                Real Blooms, Zero Fabricated Reviews
              </h3>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
                We never publish invented customer quotes or synthetic five-star badges. Every
                bouquet story shared on Petal &amp; Prose is added only with genuine permission
                from real senders and recipients.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5 sm:mt-0 sm:shrink-0">
              <Link
                href="/about"
                className="inline-flex min-h-[42px] items-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
              >
                Read Our Story
              </Link>
              <Link
                href="/contact"
                className="inline-flex min-h-[42px] items-center rounded-full bg-[var(--accent-primary)] px-5 text-xs font-semibold text-white hover:bg-[var(--accent-primary-hover)]"
              >
                Share Feedback
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Popular Occasions Directory */}
      <section id="occasions" className="border-t border-[var(--border-hairline)] py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-primary)]">
                Popular Occasions
              </p>
              <h2 className="mt-1 font-display text-3xl font-medium sm:text-4xl">
                Eleven Signature Styles &amp; Sentiment Guides
              </h2>
            </div>
            <Link
              href="/occasions"
              className="text-xs font-semibold text-[var(--accent-primary)] underline-offset-4 hover:underline"
            >
              Open Occasion Templates &rarr;
            </Link>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CORE_ELEVEN_OCCASIONS.map((occ) => (
              <Link
                key={occ.slug}
                href={`/occasions/${occ.slug}`}
                className="group rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 transition hover:border-[var(--accent-primary)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-xl font-medium group-hover:text-[var(--accent-primary)]">
                    {occ.label}
                  </span>
                  <span className="text-xs text-[var(--accent-primary)]">&rarr;</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">
                  {occ.tagline}
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
            <span className="self-center font-medium">More sentiments:</span>
            {CANONICAL_OCCASIONS.filter((o) => !coreOccasionSlugSet.has(o)).map((occ) => (
              <Link
                key={occ}
                href={`/occasions/${occ}`}
                className="rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1 hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
              >
                {formatOccasionLabel(occ)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Frequently Asked Questions */}
      <section
        id="faq"
        className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] py-14 sm:py-16"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-primary)]">
                Questions &amp; Craft Details
              </p>
              <h2 className="mt-1 font-display text-3xl font-medium sm:text-4xl">
                Frequently Asked Questions
              </h2>
            </div>
            <Link
              href="/faq"
              className="text-xs font-semibold text-[var(--accent-primary)] underline-offset-4 hover:underline"
            >
              All Questions &rarr;
            </Link>
          </div>
          <div className="mt-7">
            <FaqAccordion items={SITE_FAQS.slice(0, 6)} />
          </div>
        </div>
      </section>

      {/* 9. Final Call to Action */}
      <section className="border-t border-[var(--border-hairline)] py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-[var(--border-hairline)] bg-[var(--accent-primary)] px-6 py-12 text-center text-white shadow-lg sm:px-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-white/80">
              Free Atelier Studio · Zero Sign-Up Required
            </p>
            <h2 className="mt-2 font-display text-3xl font-medium sm:text-5xl">
              Ready to Send Something Unforgettable?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
              Pick focal blooms, tuck seasonal greenery inside artisanal paper, seal your letter,
              and share a private keepsake link in moments.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/studio"
                className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-[var(--accent-primary)] shadow-xs transition hover:bg-[var(--bg-canvas)]"
              >
                Create Your Bouquet
              </Link>
              <Link
                href="/occasions"
                className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-white/35 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Explore Occasions
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
