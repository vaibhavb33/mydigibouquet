"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/flowers", label: "Flower Library" },
  { href: "/occasions", label: "Occasions" },
  { href: "/gallery", label: "Gallery" },
  { href: "/blog", label: "Journal" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/faq", label: "FAQ" },
] as const;

export function SiteHeader() {
  const pathname = usePathname() || "/";
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center gap-2 font-display text-xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-2xl"
        >
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--accent-primary)]/30 bg-[var(--bg-surface)] text-xs font-semibold text-[var(--accent-primary)]"
          >
            P
          </span>
          <span className="truncate">Petal &amp; Prose</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
          {NAV_LINKS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition ${
                  active
                    ? "text-[var(--accent-primary)] underline decoration-[var(--accent-primary)]/40 underline-offset-8"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/studio"
            data-testid="nav-create-bouquet-btn"
            className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-[var(--accent-primary)] px-3.5 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)] sm:px-5 sm:text-sm"
          >
            <span className="sm:hidden">Create</span>
            <span className="hidden sm:inline">Create Your Bouquet</span>
          </Link>

          <button
            type="button"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            data-testid="mobile-menu-toggle"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-primary)] lg:hidden"
          >
            {mobileOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          data-testid="mobile-nav-drawer"
          className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-4 lg:hidden"
        >
          <nav className="grid gap-1.5" aria-label="Mobile navigation">
            {[
              { href: "/", label: "Home" },
              { href: "/studio", label: "Bouquet Studio" },
              ...NAV_LINKS,
              { href: "/about", label: "About Us" },
              { href: "/contact", label: "Contact" },
            ].map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex min-h-[44px] items-center justify-between rounded-xl px-3.5 text-sm font-medium ${
                    active
                      ? "bg-[var(--accent-primary-soft)] text-[var(--accent-primary)] font-semibold"
                      : "text-[var(--text-primary)] hover:bg-[var(--bg-well)]/60"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-[var(--text-muted)]">→</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
