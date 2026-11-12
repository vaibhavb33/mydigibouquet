import type { Metadata } from "next";
import Link from "next/link";
import { SITE_FAQS } from "@/lib/site-content";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { buildFaqSchema, buildPageMetadata, serializeJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Frequently Asked Questions — Digital Bouquets",
  description:
    "Answers about free bouquet creation, realistic stem layering, wrapping studio options, keepsake photos, voice messages, high-res downloads, and privacy.",
  path: "/faq",
});

export default function FaqPage() {
  const serializedSchema = serializeJsonLd(buildFaqSchema(SITE_FAQS));

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <SiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializedSchema }}
      />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]}
          className="mb-5"
        />
        <div className="space-y-3 border-b border-[var(--border-hairline)] pb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-primary)]">
            Support &amp; Craft Knowledge
          </p>
          <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
            Everything you need to know about crafting arrangements, recording voice notes, cropping
            photos, exporting high-resolution keepsakes, and protecting recipient privacy.
          </p>
        </div>

        <section className="mt-8" aria-label="FAQ accordion list">
          <FaqAccordion items={SITE_FAQS} allowCategoryFilter />
        </section>

        <section className="mt-12 rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8">
          <div>
            <h2 className="font-display text-2xl font-medium">Still have a question?</h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
              Reach our studio team directly—or send a bouquet reference link for fast assistance.
            </p>
          </div>
          <Link
            href="/contact"
            className="mt-4 inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)] px-6 text-xs font-semibold text-white hover:bg-[var(--accent-primary-hover)] sm:mt-0"
          >
            Contact Studio &rarr;
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

