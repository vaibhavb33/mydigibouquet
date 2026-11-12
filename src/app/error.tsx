"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled route error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <SiteHeader />

      <main className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6 sm:py-28">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-[var(--status-error-border)] bg-[var(--status-error-fill)] font-display text-xl font-semibold text-[var(--status-error-ink)]">
          !
        </span>
        <h1 className="mt-6 font-display text-4xl font-medium tracking-tight sm:text-5xl">
          Something Interrupted the Atelier
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
          We ran into an unexpected hiccup loading this view. Your saved browser studio drafts
          remain safe—retry below or return to the homepage.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-[44px] items-center rounded-full bg-[var(--accent-primary)] px-6 text-xs font-semibold text-white hover:bg-[var(--accent-primary-hover)] sm:text-sm"
          >
            Try Again
          </button>
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

