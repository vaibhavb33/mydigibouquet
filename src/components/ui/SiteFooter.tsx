import React from "react";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-4">
            <Link href="/" className="font-display text-2xl font-semibold tracking-tight">
              Petal &amp; Prose
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
              A tranquil digital floral atelier for composing lifelike arrangements, custom cotton
              stationery, keepsake photos, and voice notes—always free and ad-free.
            </p>
            <Link
              href="/studio"
              className="inline-flex min-h-[40px] items-center rounded-full bg-[var(--accent-primary)] px-5 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)]"
            >
              Create Your Bouquet →
            </Link>
          </div>

          <div className="space-y-2.5 lg:col-span-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Studio &amp; Blooms
            </h2>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li>
                <Link href="/studio" className="hover:text-[var(--text-primary)]">
                  Create Bouquet
                </Link>
              </li>
              <li>
                <Link href="/flowers" className="hover:text-[var(--text-primary)]">
                  Flower Library
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-[var(--text-primary)]">
                  Bouquet Gallery
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-[var(--text-primary)]">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5 lg:col-span-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Occasion Templates
            </h2>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-[var(--text-secondary)]">
              <li>
                <Link href="/occasions" className="hover:text-[var(--text-primary)]">
                  All Occasions
                </Link>
              </li>
              <li>
                <Link href="/occasions/romance" className="hover:text-[var(--text-primary)]">
                  Romantic
                </Link>
              </li>
              <li>
                <Link href="/occasions/birthday" className="hover:text-[var(--text-primary)]">
                  Birthday
                </Link>
              </li>
              <li>
                <Link href="/occasions/wedding" className="hover:text-[var(--text-primary)]">
                  Wedding
                </Link>
              </li>
              <li>
                <Link href="/occasions/friendship" className="hover:text-[var(--text-primary)]">
                  Friendship
                </Link>
              </li>
              <li>
                <Link href="/occasions/thank-you" className="hover:text-[var(--text-primary)]">
                  Thank You
                </Link>
              </li>
              <li>
                <Link href="/occasions/congratulations" className="hover:text-[var(--text-primary)]">
                  Congratulations
                </Link>
              </li>
              <li>
                <Link href="/occasions/mothers-day" className="hover:text-[var(--text-primary)]">
                  Mother&apos;s Day
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5 lg:col-span-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Atelier &amp; Trust
            </h2>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li>
                <Link href="/about" className="hover:text-[var(--text-primary)]">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-[var(--text-primary)]">
                  Floral Journal
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-[var(--text-primary)]">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[var(--text-primary)]">
                  Contact &amp; Support
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[var(--text-primary)]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[var(--text-primary)]">
                  Terms &amp; Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-[var(--border-hairline)] pt-6 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Petal &amp; Prose Botanical Atelier. Crafted without display ads.</p>
          <p>Private unboxing links are excluded from search engine indexing.</p>
        </div>
      </div>
    </footer>
  );
}

