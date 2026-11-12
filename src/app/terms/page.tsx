import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms & Conditions",
  description:
    "Terms of service, acceptable use standards, personal keepsake download rights, and content moderation guidelines for Petal & Prose.",
  path: "/terms",
});

const TERMS_SECTIONS = [
  {
    title: "1. Studio License & Personal Keepsake Exports",
    body: "You may freely compose digital bouquets inside Petal & Prose for personal gifting, celebrations, and non-commercial sharing, and download rendered PNG/JPG images and wallpapers of your completed arrangements.",
  },
  {
    title: "2. User-Submitted Text, Photos & Voice Notes",
    body: "You retain responsibility for greeting card messages, recipient/sender names, cropped photos, and audio recordings you upload. Do not upload unlawful, defamatory, harassing, infringing, or explicit media, or content depicting individuals without appropriate permission.",
  },
  {
    title: "3. Link Confidentiality & Moderation",
    body: "Anyone with a published /b/[slug] URL can view that digital bouquet. We reserve the right to disable or delete shared arrangements or media attachments reported as abusive or infringing via our Contact moderation channel.",
  },
  {
    title: "4. Botanical Assets & Platform Software",
    body: "The studio botanical illustrations, wrapping paper textures, arrangement preset geometries, website typography, and application codebase remain the intellectual property of Petal & Prose and may not be bulk-scraped, redistributed as standalone clipart packs, or resold as competing asset libraries.",
  },
  {
    title: "5. Service Availability & AI Suggestions",
    body: "The studio, draft storage, and optional AI Florist arrangement suggestions are provided on an 'as is' basis. While we take care to preserve published share links reliably, we recommend downloading high-resolution PNG or JPG copies for permanent archival keepsakes.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Terms & Conditions", path: "/terms" },
          ]}
          className="mb-5"
        />
        <div className="space-y-2.5 border-b border-[var(--border-hairline)] pb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-primary)]">
            Studio Service Terms
          </p>
          <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">
            Terms &amp; Conditions
          </h1>
          <p className="text-xs text-[var(--text-muted)]">Last Updated: November 2026</p>
        </div>

        <div className="mt-8 space-y-6">
          {TERMS_SECTIONS.map((sec) => (
            <section
              key={sec.title}
              className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6"
            >
              <h2 className="font-display text-2xl font-medium text-[var(--text-primary)]">
                {sec.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {sec.body}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/privacy"
            className="inline-flex min-h-[42px] items-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
          >
            Read Privacy Policy &rarr;
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-[42px] items-center rounded-full bg-[var(--accent-primary)] px-5 text-xs font-semibold text-white hover:bg-[var(--accent-primary-hover)]"
          >
            Contact Studio Team
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

