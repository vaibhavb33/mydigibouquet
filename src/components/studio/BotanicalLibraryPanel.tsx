"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CATALOG_ENTRIES, CATALOG_META_MAP } from "@/generated/catalog-manifest";
import {
  BotanicalRole,
  CANONICAL_OCCASIONS,
  ColorFamily,
  MAX_STEMS_GLOBAL,
  OccasionSlug,
} from "@/engine/types";
import { OCCASION_TEMPLATES } from "@/engine/occasions";
import { useStudioScene } from "./StudioSceneProvider";

type LibraryFilterMode = "all" | "greenery_mix" | BotanicalRole;

const ROLE_TABS: Array<{ id: LibraryFilterMode; label: string }> = [
  { id: "all", label: "All Stems" },
  { id: "focal", label: "Focals" },
  { id: "greenery_mix", label: "Greenery & Fillers" },
  { id: "foliage", label: "Greenery" },
  { id: "filler", label: "Fillers" },
  { id: "petal", label: "Petals" },
];

const COLOR_CHIPS: Array<{ id: "all" | ColorFamily; label: string; hex: string }> = [
  { id: "all", label: "All Hues", hex: "#E5DFD3" },
  { id: "crimson", label: "Crimson", hex: "#9F2D3A" },
  { id: "blush", label: "Blush", hex: "#E8A9AE" },
  { id: "ivory", label: "Ivory", hex: "#F4EFE4" },
  { id: "amber", label: "Amber", hex: "#E8A627" },
  { id: "lavender", label: "Lavender", hex: "#9A84C2" },
  { id: "sage", label: "Sage", hex: "#6F8B79" },
];

export function BotanicalLibraryPanel({
  activeStep = 1,
  onStepChange,
}: {
  activeStep?: 1 | 2 | 3 | 4 | 5;
  onStepChange?: (step: 1 | 2 | 3 | 4 | 5) => void;
}) {
  const { scene, addStem, removeOneBySku, replaceStemSku } = useStudioScene();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<LibraryFilterMode>(
    activeStep === 1 ? "focal" : activeStep === 2 ? "greenery_mix" : "all",
  );
  const [colorFilter, setColorFilter] = useState<"all" | ColorFamily>("all");
  const [occasionFilter, setOccasionFilter] = useState<"all" | OccasionSlug>("all");
  const [replacingSku, setReplacingSku] = useState<string | null>(null);

  // Sync default filter smoothly when user navigates between Steps 1, 2, 3
  useEffect(() => {
    if (activeStep === 1) {
      setRoleFilter("focal");
    } else if (activeStep === 2) {
      setRoleFilter("greenery_mix");
    } else if (activeStep === 3) {
      setRoleFilter("all");
    }
    setReplacingSku(null);
  }, [activeStep]);

  const stemCountsBySku = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of scene.stems) {
      map.set(s.skuId, (map.get(s.skuId) ?? 0) + 1);
    }
    return map;
  }, [scene.stems]);

  const selectedGrouped = useMemo(() => {
    const out: Array<{ skuId: string; name: string; colorHex: string; count: number; stemId: string }> = [];
    const seen = new Map<string, number>();
    for (const s of scene.stems) {
      const idx = seen.get(s.skuId);
      if (idx !== undefined) {
        out[idx]!.count += 1;
      } else {
        const meta = CATALOG_META_MAP.get(s.skuId);
        seen.set(s.skuId, out.length);
        out.push({
          skuId: s.skuId,
          name: meta?.name ?? s.skuId,
          colorHex: meta?.colorHex ?? "#999999",
          count: 1,
          stemId: s.id,
        });
      }
    }
    return out;
  }, [scene.stems]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG_ENTRIES.filter((item) => {
      if (roleFilter === "greenery_mix") {
        if (item.role !== "foliage" && item.role !== "filler") return false;
      } else if (roleFilter !== "all" && item.role !== roleFilter) {
        return false;
      }
      if (colorFilter !== "all" && item.colorFamily !== colorFilter) return false;
      if (occasionFilter !== "all" && !item.occasionTags.includes(occasionFilter)) return false;
      if (q) {
        const hay =
          `${item.name} ${item.variantLabel} ${item.meaningShort} ${item.familyId} ${item.speciesSlug}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [colorFilter, occasionFilter, query, roleFilter]);

  const atLimit = scene.stems.length >= MAX_STEMS_GLOBAL;

  const handleCardPrimaryAction = (skuId: string) => {
    if (replacingSku) {
      const targetStem = scene.stems.find((s) => s.skuId === replacingSku);
      if (targetStem) {
        replaceStemSku(targetStem.id, skuId);
      }
      setReplacingSku(null);
      return;
    }
    addStem(skuId);
  };

  return (
    <div className="flex h-full flex-col bg-[var(--bg-surface)] text-[var(--text-primary)]">
      {/* Header + Filters */}
      <div className="border-b border-[var(--border-hairline)] px-4 pt-3.5 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-primary)]">
              {activeStep === 1
                ? "Step 1 · Select Flowers"
                : activeStep === 2
                  ? "Step 2 · Greenery & Fillers"
                  : "Botanical Catalog"}
            </p>
            <h2 className="font-display text-lg font-medium tracking-tight">Botanical Library</h2>
          </div>
          <span
            className="rounded-full bg-[var(--bg-well)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]"
            data-testid="stem-counter"
          >
            {scene.stems.length} / {MAX_STEMS_GLOBAL} stems
          </span>
        </div>

        {/* Search Field */}
        <label className="mt-2.5 block">
          <span className="sr-only">Search flowers and greenery</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              activeStep === 2
                ? "Search eucalyptus, fern, ruscus, monstera, olive…"
                : "Search rose, peony, tulip, sunflower, lily…"
            }
            data-testid="library-search-input"
            className="w-full rounded-lg border border-[var(--border-hairline)] bg-white px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </label>

        {/* Role Filter Chips */}
        <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label="Category filter">
          {ROLE_TABS.map((tab) => {
            const active = roleFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`library-filter-${tab.id}`}
                onClick={() => setRoleFilter(tab.id)}
                className={`min-h-[30px] rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                  active
                    ? "bg-[var(--accent-primary)] text-white"
                    : "bg-[var(--bg-well)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Color Filter Swatches + Occasion Select */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1" role="group" aria-label="Color filter">
            {COLOR_CHIPS.map((c) => {
              const active = colorFilter === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  title={c.label}
                  aria-label={`Filter color: ${c.label}`}
                  aria-pressed={active}
                  onClick={() => setColorFilter(c.id)}
                  className={`h-5.5 w-5.5 rounded-full border transition ${
                    active ? "ring-2 ring-[var(--accent-primary)] ring-offset-1" : "border-[var(--border-strong)]/40"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              );
            })}
          </div>

          <select
            aria-label="Filter by occasion"
            value={occasionFilter}
            onChange={(e) => setOccasionFilter(e.target.value as "all" | OccasionSlug)}
            className="rounded-md border border-[var(--border-hairline)] bg-white px-2 py-1 text-[11px] text-[var(--text-secondary)]"
          >
            <option value="all">All occasions</option>
            {CANONICAL_OCCASIONS.map((occ) => (
              <option key={occ} value={occ}>
                {OCCASION_TEMPLATES[occ].label}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Stems Tray: quick remove or replace without leaving library */}
        {selectedGrouped.length > 0 && (
          <div className="mt-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-well)]/45 p-2">
            <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-[var(--text-secondary)]">
              <span>Selected Stems ({scene.stems.length})</span>
              {replacingSku && (
                <button
                  type="button"
                  onClick={() => setReplacingSku(null)}
                  className="font-semibold text-[var(--accent-primary)] underline"
                >
                  Cancel Replace
                </button>
              )}
            </div>
            {replacingSku && (
              <p className="mb-1.5 rounded bg-[var(--accent-primary-soft)] px-2 py-1 text-[11px] font-medium text-[var(--accent-primary)]">
                Choose a replacement below for {CATALOG_META_MAP.get(replacingSku)?.name ?? replacingSku}
              </p>
            )}
            <div className="flex max-h-20 flex-wrap gap-1 overflow-y-auto">
              {selectedGrouped.map((grp) => {
                const isReplacing = replacingSku === grp.skuId;
                return (
                  <div
                    key={grp.skuId}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${
                      isReplacing
                        ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)]"
                        : "border-[var(--border-hairline)] bg-white"
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full border border-black/15"
                      style={{ backgroundColor: grp.colorHex }}
                    />
                    <span className="max-w-[92px] truncate font-medium">{grp.name}</span>
                    <span className="font-mono text-[10px] text-[var(--text-muted)]">×{grp.count}</span>
                    <button
                      type="button"
                      onClick={() => removeOneBySku(grp.skuId)}
                      title={`Remove one ${grp.name}`}
                      aria-label={`Remove one ${grp.name}`}
                      data-testid={`tray-remove-${grp.skuId}`}
                      className="rounded px-1 font-bold text-[var(--status-error-ink)] hover:bg-[var(--status-error-fill)]"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplacingSku(isReplacing ? null : grp.skuId)}
                      title={`Replace ${grp.name}`}
                      aria-label={`Replace ${grp.name}`}
                      data-testid={`tray-replace-${grp.skuId}`}
                      className="rounded px-1 text-[10px] font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-primary-soft)]"
                    >
                      ⇄
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Botanical Grid */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {filteredItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border-hairline)] p-6 text-center text-sm text-[var(--text-secondary)]">
            No stems match this combination.{" "}
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setRoleFilter("all");
                setColorFilter("all");
                setOccasionFilter("all");
              }}
              className="font-medium text-[var(--accent-primary)] underline"
            >
              Show All Stems
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredItems.map((item) => {
              const count = stemCountsBySku.get(item.skuId) ?? 0;
              return (
                <div
                  key={item.skuId}
                  className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white p-2 text-left transition ${
                    replacingSku
                      ? "border-dashed border-[var(--accent-primary)] hover:bg-[var(--accent-primary-soft)]/30"
                      : "border-[var(--border-hairline)] hover:border-[var(--accent-primary)] hover:shadow-sm"
                  }`}
                >
                  <button
                    type="button"
                    disabled={!replacingSku && atLimit}
                    onClick={() => handleCardPrimaryAction(item.skuId)}
                    data-testid={`add-stem-${item.skuId}`}
                    className="flex flex-col text-left disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[var(--bg-well)]/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.thumbPath}
                        alt={`${item.name} — ${item.variantLabel}`}
                        loading="lazy"
                        className="h-full w-full object-contain p-1 transition duration-300 group-hover:scale-105"
                      />
                      {count > 0 && (
                        <span className="absolute top-1.5 right-1.5 rounded-full bg-[var(--accent-primary)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {count}
                        </span>
                      )}
                      <span className="absolute bottom-1.5 left-1.5 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] backdrop-blur-sm">
                        {item.variantLabel}
                      </span>
                    </div>
                    <div className="mt-1.5 flex w-full items-start justify-between gap-1 px-0.5">
                      <span className="line-clamp-1 text-xs font-semibold text-[var(--text-primary)]">
                        {item.name}
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-[var(--accent-primary)]">
                        {replacingSku ? "Swap" : "+"}
                      </span>
                    </div>
                    <span className="line-clamp-1 px-0.5 text-[11px] text-[var(--text-muted)]">
                      {item.meaningShort}
                    </span>
                  </button>

                  {count > 0 && !replacingSku && (
                    <div className="mt-1.5 flex items-center justify-between gap-1 border-t border-[var(--border-hairline)] pt-1.5">
                      <button
                        type="button"
                        onClick={() => removeOneBySku(item.skuId)}
                        data-testid={`remove-stem-${item.skuId}`}
                        aria-label={`Remove one ${item.name}`}
                        className="min-h-[26px] flex-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-well)]/60 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--status-error-fill)] hover:text-[var(--status-error-ink)]"
                      >
                        −
                      </button>
                      <span className="px-1 font-mono text-[11px] font-semibold text-[var(--text-primary)]">
                        {count}
                      </span>
                      <button
                        type="button"
                        disabled={atLimit}
                        onClick={() => addStem(item.skuId)}
                        aria-label={`Add another ${item.name}`}
                        className="min-h-[26px] flex-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-well)]/60 text-xs font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-primary-soft)] disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Step Footer Navigation */}
      {onStepChange && (activeStep === 1 || activeStep === 2) && (
        <div className="flex items-center justify-between gap-2 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2.5">
          {activeStep === 2 ? (
            <button
              type="button"
              onClick={() => onStepChange(1)}
              className="min-h-[36px] rounded-xl border border-[var(--border-hairline)] px-3 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-well)]"
            >
              ← Flowers
            </button>
          ) : (
            <span className="text-[11px] text-[var(--text-muted)]">Select at least 3 stems</span>
          )}
          <button
            type="button"
            data-testid={activeStep === 1 ? "next-to-greenery-btn" : "next-to-arrange-btn"}
            onClick={() => onStepChange(activeStep === 1 ? 2 : 3)}
            className="min-h-[36px] flex-1 rounded-xl bg-[var(--accent-primary)] px-3 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)]"
          >
            {activeStep === 1 ? "Next: Select Greenery →" : "Next: Arrange Bouquet →"}
          </button>
        </div>
      )}
    </div>
  );
}
