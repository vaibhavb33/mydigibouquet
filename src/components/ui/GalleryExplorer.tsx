"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { BouquetSceneV1 } from "@/engine/types";
import { OCCASION_TEMPLATES } from "@/engine/occasions";
import { BouquetCanvasDisplay } from "@/components/unboxing/BouquetCanvasDisplay";

export type GalleryItemView = {
  slug: string;
  title: string;
  occasionTag: string | null;
  scene: BouquetSceneV1;
  presetId?: string | null;
};

export function GalleryExplorer({ items }: { items: readonly GalleryItemView[] }) {
  const [occasionFilter, setOccasionFilter] = useState<string>("all");

  const filterSlugs = useMemo(() => {
    const tags = Array.from(
      new Set(items.map((item) => item.occasionTag).filter((t): t is string => Boolean(t))),
    );
    return tags;
  }, [items]);

  const filtered = useMemo(() => {
    if (occasionFilter === "all") return items;
    return items.filter((item) => item.occasionTag === occasionFilter);
  }, [items, occasionFilter]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter gallery by occasion">
        <button
          type="button"
          role="tab"
          aria-selected={occasionFilter === "all"}
          onClick={() => setOccasionFilter("all")}
          className={`min-h-[38px] rounded-full border px-4 text-xs font-semibold transition ${
            occasionFilter === "all"
              ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
              : "border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]"
          }`}
        >
          All Arrangements ({items.length})
        </button>
        {filterSlugs.map((slug) => {
          const active = occasionFilter === slug;
          const label =
            slug in OCCASION_TEMPLATES
              ? OCCASION_TEMPLATES[slug as keyof typeof OCCASION_TEMPLATES].label
              : slug.replace(/-/g, " ");
          return (
            <button
              key={slug}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setOccasionFilter(slug)}
              className={`min-h-[38px] rounded-full border px-4 text-xs font-semibold capitalize transition ${
                active
                  ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                  : "border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const occasionLabel =
            item.occasionTag && item.occasionTag in OCCASION_TEMPLATES
              ? OCCASION_TEMPLATES[item.occasionTag as keyof typeof OCCASION_TEMPLATES].label
              : item.occasionTag?.replace(/-/g, " ") ?? "Custom Atelier";

          const customizeHref = item.presetId
            ? `/studio?preset=${item.presetId}`
            : item.occasionTag
              ? `/studio?occasion=${item.occasionTag}`
              : "/studio";

          return (
            <article
              key={item.slug}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] transition hover:-translate-y-0.5 hover:border-[var(--accent-primary)] hover:shadow-md"
            >
              <Link
                href={`/b/${item.slug}`}
                className="block aspect-[5/6] w-full overflow-hidden bg-[var(--bg-well)]/40"
              >
                <BouquetCanvasDisplay
                  scene={item.scene}
                  width={520}
                  height={624}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </Link>

              <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                <div>
                  <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
                    {item.title}
                  </h2>
                  <p className="text-xs capitalize text-[var(--text-muted)]">
                    {occasionLabel} • {item.scene.stems.length} stems
                  </p>
                </div>

                <div className="flex items-center gap-2 border-t border-[var(--border-hairline)] pt-3">
                  <Link
                    href={`/b/${item.slug}`}
                    className="inline-flex min-h-[36px] flex-1 items-center justify-center rounded-xl border border-[var(--border-hairline)] bg-white px-3 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                  >
                    Unbox Bouquet →
                  </Link>
                  <Link
                    href={customizeHref}
                    className="inline-flex min-h-[36px] flex-1 items-center justify-center rounded-xl bg-[var(--accent-primary)] px-3 text-xs font-semibold text-white hover:bg-[var(--accent-primary-hover)]"
                  >
                    Customize Style
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

