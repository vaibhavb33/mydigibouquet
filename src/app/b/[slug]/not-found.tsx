import Link from "next/link";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";

export default function BouquetNotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <SiteHeader />

      <main className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] font-display text-xl font-medium text-[var(--accent-primary)]">
          P&amp;P
        </span>
        <h1 className="mt-6 font-display text-3xl font-medium sm:text-5xl">
          Bouquet Link Unavailable
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
          This digital bouquet may have been removed by its sender or the private share link is
          incomplete.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/studio"
            className="inline-flex min-h-[44px] items-center rounded-full bg-[var(--accent-primary)] px-6 text-xs font-semibold text-white hover:bg-[var(--accent-primary-hover)]"
          >
            Design a Bouquet
          </Link>
          <Link
            href="/gallery"
            className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-5 text-xs font-medium text-[var(--text-primary)]"
          >
            Browse Gallery
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

