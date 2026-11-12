"use client";

import React, { useState } from "react";

export function CopyStarterChip({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
      <p className="text-sm italic leading-relaxed text-[var(--text-secondary)]">“{text}”</p>
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="self-start min-h-[32px] rounded-full border border-[var(--border-hairline)] bg-white px-3 text-xs font-semibold text-[var(--accent-primary)] hover:border-[var(--accent-primary)]"
      >
        {copied ? "Copied Note ✓" : "Copy Note Starter"}
      </button>
    </div>
  );
}

