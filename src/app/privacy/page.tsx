import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy & Private Gift Link Protection",
  description:
    "How Petal & Prose stores bouquet scenes, keepsake photos, voice messages, local browser drafts, and enforces private noindex link protections.",
  path: "/privacy",
});

const PRIVACY_SECTIONS = [
  {
    title: "1. Minimal Data by Design",
    body: "You can arrange, preview, and download bouquets with zero account registration. We only process information you choose to supply inside the Composition Studio (selected botanical stems, card text, optional cropped keepsake images, optional audio voice messages, or Studio project saves) or inside our Contact form.",
  },
  {
    title: "2. Local Browser Drafts & Workspace Storage",
    body: "While designing in the Studio, uncommitted edits are auto-saved locally in your browser storage so refreshing your page does not erase your arrangement. Saved projects under 'My Bouquets' are scoped to an anonymous workspace identifier stored locally on your device.",
  },
  {
    title: "3. Private Shared Bouquet Protections",
    body: "Published recipient routes (/b/[slug]) are served with X-Robots-Tag: noindex, nofollow and Referrer-Policy: no-referrer headers so shared gift links stay out of search engine results and do not leak across external referrers. Senders can also toggle 'Hide names in preview' before sharing so names are omitted from social metadata and Open Graph images.",
  },
  {
    title: "4. Photo & Voice Message Security Validation",
    body: "Uploaded keepsake photos (up to 6 JPEG, PNG, or WebP images per bouquet) and personal voice recordings (MP3, WAV, M4A, OGG, or WebM audio) are validated on the server via binary magic-byte inspection—not merely file extensions—and SVG scripts or executable types are strictly rejected.",
  },
  {
    title: "5. Cookieless Privacy-First Analytics (No Behavioral Ads)",
    body: "Petal & Prose never sells user data, never loads third-party ad networks, and sets zero tracking cookies. Optional first-party feature counts (such as aggregate daily PNG exports) contain no IP addresses, browser fingerprints, names, or bouquet links—and automatically turn off whenever Do-Not-Track (DNT) or Global Privacy Control (GPC) is enabled.",
  },
  {
    title: "6. Contact Submissions & Removal Requests",
    body: "Messages sent through /contact are stored strictly to respond to feedback, bug reports, or bouquet moderation/removal requests. To remove any published bouquet or uploaded attachment immediately, submit its /b/[slug] link via Contact.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Privacy Policy", path: "/privacy" },
          ]}
          className="mb-5"
        />
        <div className="space-y-2.5 border-b border-[var(--border-hairline)] pb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-primary)]">
            Legal &amp; Privacy Architecture
          </p>
          <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="text-xs text-[var(--text-muted)]">Effective Date: November 2026</p>
        </div>

        <div className="mt-8 space-y-6">
          {PRIVACY_SECTIONS.map((sec) => (
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
            href="/terms"
            className="inline-flex min-h-[42px] items-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
          >
            Read Terms &amp; Conditions &rarr;
          </Link>
          <Link
            href="/contact?topic=moderation"
            className="inline-flex min-h-[42px] items-center rounded-full bg-[var(--accent-primary)] px-5 text-xs font-semibold text-white hover:bg-[var(--accent-primary-hover)]"
          >
            Request Bouquet Removal
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

