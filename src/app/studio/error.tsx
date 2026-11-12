"use client";

import React, { useEffect } from "react";
import Link from "next/link";

export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Studio workspace error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-canvas)] px-4 text-center text-[var(--text-primary)]">
      <div className="max-w-md rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-primary)]">
          Bouquet Studio Recovery
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium">Canvas Workspace Paused</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          Your local browser draft and saved studio projects are safely preserved. Reload the
          workspace to continue arranging stems.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-[42px] items-center rounded-full bg-[var(--accent-primary)] px-5 text-xs font-semibold text-white hover:bg-[var(--accent-primary-hover)]"
          >
            Reopen Studio
          </button>
          <Link
            href="/flowers"
            className="inline-flex min-h-[42px] items-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-5 text-xs font-semibold text-[var(--text-primary)]"
          >
            Browse Flowers
          </Link>
        </div>
      </div>
    </div>
  );
}

