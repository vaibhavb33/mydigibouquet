"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { BotanicalMeta, BotanicalRole, ColorFamily } from "@/engine/types";
import { BotanicalImage } from "./SkeletonCard";

const ROLE_TABS: ReadonlyArray<{ id: "all" | BotanicalRole; label: string }> = [
  { id: "all", label: "All Botanicals" },
  { id: "focal", label: "Focal Blooms" },
  { id: "filler", label: "Delicate Fillers" },
  { id: "foliage", label: "Greenery & Foliage" },
  { id: "petal", label: "Pressed Petals" },
];

const COLOR_FILTERS: ReadonlyArray<{ id: "all" | ColorFamily; label: string; hex?: string }> = [
  { id: "all", label: "All Colors" },
  { id: "crimson", label: "Crimson", hex: "#9F2D3A" },
  { id: "blush", label: "Blush", hex: "#E8A9AE" },
  { id: "ivory", label: "Ivory", hex: "#EDE6D6" },
  { id: "amber", label: "Amber", hex: "#E7A83E" },
  { id: "lavender", label: "Lavender", hex: "#9884B8" },
  { id: "sage", label: "Sage", hex: "#6F886E" },
];

export function FlowerLibraryExplorer({
  entries,
  compactMode = false,
  initialQuery = "",
}: {
  entries: readonly BotanicalMeta[];
  compactMode?: boolean;
  initialQuery?: string;
}) {
  const [roleFilter, setRoleFilter] = useState<"all" | BotanicalRole>("all");
  const [colorFilter, setColorFilter] = useState<"all" | ColorFamily>("all");
  const [query, setQuery] = useState(initialQuery);
  const [detailStem, setDetailStem] = useState<BotanicalMeta | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = entries.filter((item) => {
      if (roleFilter !== "all" && item.role !== roleFilter) return false;
      if (colorFilter !== "all" && item.colorFamily !== colorFilter) return false;
      if (q) {
        const hay = `${item.name} ${item.variantLabel} ${item.meaningShort} ${item.colorFamily} ${item.speciesSlug}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return compactMode ? list.slice(0, 8) : list;
  }, [colorFilter, compactMode, entries, query, roleFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Flower category filter">
            {ROLE_TABS.map((tab) => {
              const active = roleFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-testid={`flower-cat-${tab.id}`}
                  onClick={() => setRoleFilter(tab.id)}
                  className={`min-h-[38px] rounded-full border px-3.5 text-xs font-semibold transition ${
                    active
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                      : "border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {!compactMode && (
            <div className="relative w-full sm:w-64">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search rose, peony, lotus..."
                data-testid="flower-search-input"
                aria-label="Search flower library"
                className="min-h-[40px] w-full rounded-full border border-[var(--border-strong)] bg-white px-4 text-xs text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Palette:
          </span>
          {COLOR_FILTERS.map((cf) => {
            const active = colorFilter === cf.id;
            return (
              <button
                key={cf.id}
                type="button"
                data-testid={`flower-color-${cf.id}`}
                onClick={() => setColorFilter(cf.id)}
                className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition ${
                  active
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] text-[var(--accent-primary)] font-semibold"
                    : "border-[var(--border-hairline)] bg-white text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                }`}
              >
                {cf.hex && (
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 rounded-full border border-black/15"
                    style={{ backgroundColor: cf.hex }}
                  />
                )}
                {cf.label}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-10 text-center">
          <p className="font-display text-2xl font-medium text-[var(--text-primary)]">
            No botanicals matched those filters
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Try clearing your palette or category filter to browse all {entries.length} studio stems.
          </p>
          <button
            type="button"
            onClick={() => {
              setRoleFilter("all");
              setColorFilter("all");
              setQuery("");
            }}
            className="mt-4 min-h-[40px] rounded-full bg-[var(--accent-primary)] px-5 text-xs font-semibold text-white"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((item, idx) => (
            <article
              key={item.skuId}
              data-testid={`flower-card-${item.skuId}`}
              className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 transition hover:border-[var(--accent-primary)]"
            >
              <div className="aspect-square w-full overflow-hidden rounded-xl bg-[var(--bg-well)]/55">
                <BotanicalImage
                  src={item.studioPath}
                  alt={`${item.name} — ${item.variantLabel}`}
                  width={320}
                  height={320}
                  priority={idx < 4}
                  className="h-full w-full object-contain p-3"
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="rounded-full bg-[var(--bg-well)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  {item.role}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-black/15"
                    style={{ backgroundColor: item.colorHex }}
                  />
                  {item.variantLabel}
                </span>
              </div>

              <h3 className="mt-2 font-display text-xl font-medium text-[var(--text-primary)]">
                {item.name}
              </h3>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                {item.meaningShort}
              </p>

              <div className="mt-4 flex items-center gap-2 border-t border-[var(--border-hairline)] pt-3">
                {item.hasSpeciesPage ? (
                  <Link
                    href={`/flowers/${item.speciesSlug}`}
                    className="inline-flex min-h-[36px] flex-1 items-center justify-center rounded-xl border border-[var(--border-hairline)] bg-white px-2.5 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                  >
                    Details
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDetailStem(item)}
                    className="inline-flex min-h-[36px] flex-1 items-center justify-center rounded-xl border border-[var(--border-hairline)] bg-white px-2.5 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                  >
                    Details
                  </button>
                )}
                <Link
                  href={`/studio?stem=${item.skuId}`}
                  className="inline-flex min-h-[36px] flex-1 items-center justify-center rounded-xl bg-[var(--accent-primary)] px-2.5 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)]"
                >
                  Use Stem
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {detailStem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={detailStem.name}
          data-testid="flower-detail-modal"
          onClick={() => setDetailStem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                  {detailStem.role} • {detailStem.variantLabel}
                </span>
                <h3 className="font-display text-2xl font-medium">{detailStem.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailStem(null)}
                className="min-h-[34px] rounded-full border border-[var(--border-hairline)] px-3 text-xs font-medium text-[var(--text-secondary)]"
              >
                Close
              </button>
            </div>
            <div className="my-4 aspect-square max-h-60 w-full overflow-hidden rounded-xl bg-[var(--bg-well)]/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={detailStem.studioPath}
                alt={detailStem.name}
                className="h-full w-full object-contain p-4"
              />
            </div>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {detailStem.meaningFull}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {detailStem.occasionTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/occasions/${tag}`}
                  className="rounded-full bg-[var(--bg-well)] px-2.5 py-1 text-[11px] font-medium capitalize text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"
                >
                  {tag.replace(/-/g, " ")}
                </Link>
              ))}
            </div>
            <Link
              href={`/studio?stem=${detailStem.skuId}`}
              className="mt-5 flex min-h-[42px] w-full items-center justify-center rounded-xl bg-[var(--accent-primary)] text-xs font-semibold text-white"
            >
              Arrange With {detailStem.name} in Studio →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

