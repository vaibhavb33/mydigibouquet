import Link from "next/link";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";

export default function GlobalNotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <SiteHeader />

      <main className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6 sm:py-28">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] font-display text-2xl font-medium text-[var(--accent-primary)] shadow-xs">
          404
        </span>
        <h1 className="mt-6 font-display text-4xl font-medium tracking-tight sm:text-5xl">
          This Garden Path Couldn&apos;t Be Found
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
          The page or arrangement link you followed may have moved or is no longer available. Open
          the Composition Studio to craft a fresh bouquet or browse our flower collection.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/studio"
            className="inline-flex min-h-[44px] items-center rounded-full bg-[var(--accent-primary)] px-6 text-xs font-semibold text-white hover:bg-[var(--accent-primary-hover)] sm:text-sm"
          >
            Create Your Bouquet
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-6 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)] sm:text-sm"
          >
            Return Home
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

