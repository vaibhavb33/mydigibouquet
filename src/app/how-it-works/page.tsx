import type { Metadata } from "next";
import Link from "next/link";
import { HOW_IT_WORKS_STEPS } from "@/lib/site-content";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "How It Works — Create a Digital Bouquet in 5 Steps",
  description:
    "Learn how to select botanical stems, layer greenery, customize wrapping & ribbons, crop keepsake photos, record voice notes, and share private animated bouquets.",
  path: "/how-it-works",
  keywords: [
    "create a digital bouquet",
    "how online bouquet maker works",
    "send virtual flowers step by step",
  ],
});

const STUDIO_CAPABILITIES = [
  {
    title: "Multi-Layer Canvas Architecture",
    body: "Back table surface, folded back wrap layer, ordered flower & foliage stem layer, translucent vase glazing or front paper collar, and a crisp bow knot sitting right above stems.",
  },
  {
    title: "Interactive Direct Manipulation",
    body: "Drag any stem naturally, rotate angles, adjust scale, mirror horizontally, nudge z-order forward or backward, lock completed blooms, undo/redo up to 30 steps, or switch between 7 balanced florist presets.",
  },
  {
    title: "AI Florist (Fully Editable)",
    body: "Describe the recipient or mood anytime. Our AI Florist interprets your prompt, chooses matching blooms from the 47-stem studio library, and inserts real editable stems—never static flat images.",
  },
  {
    title: "Studio Wrapping & Ribbon Finishing",
    body: "Choose Kraft paper, Ivory parchment, Blush linen, Herringbone textured paper, Sage cotton, Charcoal wrap, Clear or Floral cellophane, Ceramic cylinders, or Glass vases paired with Satin, Silk, Velvet ribbons, or Natural Twine.",
  },
  {
    title: "Custom Stationery, Photos & Voice",
    body: "Pair six curated card templates and serif/script font combinations with up to 6 cropped JPEG/PNG/WebP keepsake photos and an inline MediaRecorder (or fallback file upload) voice note.",
  },
  {
    title: "Private Unboxing & Hi-Res Exports",
    body: "Recipients tap your sealed card to open the bouquet with gentle sway motion, inspect flower meanings, zoom keepsake photos in a lightbox, replay your voice message, and save PNG/JPG portraits or mobile wallpapers.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "How It Works", path: "/how-it-works" },
          ]}
          className="mb-5"
        />
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-hairline)] pb-8">
          <div className="max-w-2xl space-y-2.5">
            <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-primary)]">
              Studio Guide
            </p>
            <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">
              How Petal &amp; Prose Works
            </h1>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              Crafting a bespoke digital bouquet takes a couple of calm minutes—and requires zero
              design software or account signup.
            </p>
          </div>
          <Link
            href="/studio"
            className="inline-flex min-h-[44px] items-center rounded-full bg-[var(--accent-primary)] px-6 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)] sm:text-sm"
          >
            Start Creating Now &rarr;
          </Link>
        </div>

        <section className="mt-10 grid gap-6 md:grid-cols-2" aria-label="Step by step workflow">
          {HOW_IT_WORKS_STEPS.map((item) => (
            <div
              key={item.step}
              className="flex flex-col justify-between rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 sm:p-7"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-4xl font-medium text-[var(--accent-primary)]">
                    {item.step}
                  </span>
                  <span className="rounded-full bg-[var(--bg-well)] px-3 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
                    Guided Atelier Flow
                  </span>
                </div>
                <h2 className="mt-3 font-display text-2xl font-medium sm:text-3xl">{item.title}</h2>
                <p className="mt-1.5 text-sm font-medium text-[var(--text-primary)]">{item.summary}</p>
                <p className="mt-2.5 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-14 border-t border-[var(--border-hairline)] pt-12">
          <h2 className="font-display text-3xl font-medium">
            Inside the Bouquet Atelier Engine
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
            A closer look at every creative and privacy feature included free across desktop,
            tablet, and smartphone browsers.
          </p>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {STUDIO_CAPABILITIES.map((cap) => (
              <div
                key={cap.title}
                className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6"
              >
                <h3 className="font-display text-xl font-medium text-[var(--text-primary)]">
                  {cap.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
                  {cap.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-8 text-center">
          <h2 className="font-display text-3xl font-medium">Ready to Arrange Your First Stem?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--text-secondary)]">
            Jump into the live Studio with starter blossoms pre-arranged, or browse curated
            occasion guides first.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/studio"
              className="inline-flex min-h-[44px] items-center rounded-full bg-[var(--accent-primary)] px-7 text-xs font-semibold text-white hover:bg-[var(--accent-primary-hover)] sm:text-sm"
            >
              Create Your Bouquet
            </Link>
            <Link
              href="/occasions"
              className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-6 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)] sm:text-sm"
            >
              Browse Occasions
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

