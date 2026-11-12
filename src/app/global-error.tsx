"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#F7F4EE] px-4 text-center text-[#1F241F]">
        <div className="max-w-md rounded-3xl border border-[#DDD6C8] bg-[#FDFBF7] p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#2D4739]">
            Petal &amp; Prose Recovery
          </p>
          <h1 className="mt-2 font-serif text-3xl font-medium">Unexpected Application Error</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#52584F]">
            Please refresh to restore your studio workspace cleanly.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-full bg-[#2D4739] px-5 py-2.5 text-xs font-semibold text-white"
            >
              Reload View
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

