"use client";

import React, { useState } from "react";

export function BotanicalImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse rounded-xl bg-[var(--bg-well)]/80"
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
      />
    </div>
  );
}

export function SkeletonCardGrid({ count = 6, colsClass = "sm:grid-cols-2 lg:grid-cols-3" }: {
  count?: number;
  colsClass?: string;
}) {
  return (
    <div className={`grid gap-6 ${colsClass}`} aria-busy="true" aria-label="Loading botanical showcase">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 animate-pulse"
        >
          <div className="aspect-[5/6] w-full rounded-xl bg-[var(--bg-well)]/80" />
          <div className="mt-4 h-5 w-2/3 rounded bg-[var(--bg-well)]" />
          <div className="mt-2 h-3.5 w-full rounded bg-[var(--bg-well)]/70" />
        </div>
      ))}
    </div>
  );
}

