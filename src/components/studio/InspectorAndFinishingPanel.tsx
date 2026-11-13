"use client";

import React, { useMemo, useState } from "react";
import {
  AUDIO_TRACK_IDS,
  BOW_STYLE_IDS,
  CARD_TEMPLATE_IDS,
  CARD_TEXT_COLOR_IDS,
  CARD_TEXT_COLOR_STYLES,
  COMPOSITION_PRESET_IDS,
  FONT_PAIRING_IDS,
  OccasionSlug,
  PAPER_TINT_IDS,
  PAPER_TINT_STYLES,
  RIBBON_COLOR_IDS,
  RIBBON_FINISH_IDS,
  RibbonFinishId,
  STEM_VISIBILITY_IDS,
  TABLE_SURFACE_IDS,
  UI_COPY,
  VESSEL_IDS,
  VESSEL_RULES,
  WAX_SEAL_COLOR_IDS,
} from "@/engine/types";
import { CORE_ELEVEN_OCCASIONS, OCCASION_TEMPLATES } from "@/engine/occasions";
import { COMPOSITION_PRESET_LABELS, STARTER_BOUQUETS } from "@/engine/presets";
import { computeArrangementSuggestions } from "@/engine/suggestions";
import { BOTANICAL_FAMILIES, CATALOG_ENTRIES, CATALOG_META_MAP } from "@/generated/catalog-manifest";
import { TABLE_SURFACE_THEMES } from "@/engine/canvas-renderer";
import { createDomTextMeasurer, getCardFontFamilies, wrapCardMessage } from "@/lib/card-layout";
import { CARD_MESSAGE_STARTERS, CARD_TEMPLATE_META, resolveCardAppearance } from "@/lib/card-styles";
import { PhotoCropperAttachment } from "./PhotoCropperAttachment";
import { ShareAndExportControls } from "./ShareAndExportControls";
import { VoiceMessageRecorder } from "./VoiceMessageRecorder";
import { useStudioScene } from "./StudioSceneProvider";
import {
  BOW_LABELS,
  RIBBON_FINISH_LABELS,
  RIBBON_SWATCHES,
  WAX_SWATCHES,
  formatSlugLabel,
} from "@/lib/studio-labels";

export type RightPanelTab = "inspect" | "finish" | "card" | "share";

const FAMILY_MAP = new Map(BOTANICAL_FAMILIES);

export function InspectorAndFinishingPanel({
  activeTab,
  onTabChange,
  onNavigateStep,
}: {
  activeTab: RightPanelTab;
  onTabChange: (tab: RightPanelTab) => void;
  onNavigateStep?: (step: 1 | 2 | 3 | 4 | 5) => void;
}) {
  const {
    scene,
    selectedIds,
    overlapCandidates,
    setSelectedIds,
    cycleOverlappingStem,
    removeStems,
    replaceStemSku,
    duplicateStems,
    bringForward,
    sendBackward,
    toggleLockStems,
    flipStemsHorizontal,
    swapStemVariation,
    updateStemsTransform,
    applyCompositionPreset,
    loadStarterPreset,
    activePresetId,
    resetArrangement,
    setVessel,
    setBowStyle,
    setRibbonFinish,
    setRibbonColor,
    setStemVisibility,
    setTableSurface,
    applyOccasionTemplate,
    updateCard,
    setShowColophon,
    setHideNamesInPreview,
    setIsPublicShowcase,
  } = useStudioScene();

  const [fullCardModalOpen, setFullCardModalOpen] = useState(false);
  const [selectedOccasionSlug, setSelectedOccasionSlug] = useState<OccasionSlug>(
    scene.occasionTag ?? "birthday",
  );
  const occasionPreviewSpec = OCCASION_TEMPLATES[selectedOccasionSlug] ?? OCCASION_TEMPLATES.birthday;

  const selectedStems = useMemo(
    () => scene.stems.filter((s) => selectedIds.includes(s.id)),
    [scene.stems, selectedIds],
  );
  const singleStem = selectedStems.length === 1 ? selectedStems[0] : undefined;
  const singleMeta = singleStem ? CATALOG_META_MAP.get(singleStem.skuId) : undefined;
  const familyVariants = singleMeta ? (FAMILY_MAP.get(singleMeta.familyId) ?? []) : [];

  const vesselRule = VESSEL_RULES[scene.presentation.vesselId];
  const smartSuggestions = useMemo(
    () => computeArrangementSuggestions(scene, CATALOG_META_MAP),
    [scene],
  );
  const cardAppearance = useMemo(() => resolveCardAppearance(scene.card), [scene.card]);
  const hasBlankMessageWarning = !scene.card.isVisualOnly && scene.card.message.trim().length === 0;

  const cardPreview = useMemo(() => {
    const fonts = getCardFontFamilies(scene.card.fontPairingId);
    const measurer = createDomTextMeasurer();
    const wrapped = wrapCardMessage(measurer, scene.card.message, 460, fonts.bodyFont);
    return { fonts, wrapped };
  }, [scene.card.fontPairingId, scene.card.message]);

  const tabs: Array<{ id: RightPanelTab; label: string }> = [
    { id: "inspect", label: "Stem" },
    { id: "finish", label: "Style & Wrap" },
    { id: "card", label: "Card" },
    { id: "share", label: "Export & Share" },
  ];

  return (
    <div className="flex h-full flex-col bg-[var(--bg-surface)] text-[var(--text-primary)]">
      {/* Top Tabs */}
      <div
        role="tablist"
        aria-label="Studio workspace tabs"
        className="grid grid-cols-4 border-b border-[var(--border-hairline)] bg-[var(--bg-well)]/60 p-1"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-testid={`right-tab-${tab.id}`}
              onClick={() => {
                onTabChange(tab.id);
                if (onNavigateStep) {
                  if (tab.id === "card") onNavigateStep(4);
                  else if (tab.id === "share") onNavigateStep(5);
                }
              }}
              className={`min-h-[38px] rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                active
                  ? "bg-white text-[var(--accent-primary)] shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Scrollable Panel Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* ==================== TAB 1: INSPECTOR ==================== */}
        {activeTab === "inspect" && (
          <div className="space-y-4">
            {selectedStems.length === 0 ? (
              <>
                <div
                  data-testid="no-stem-selected-card"
                  className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-well)]/40 p-6 text-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl text-[var(--accent-primary)] shadow-2xs">
                    ✦
                  </div>
                  <h3 className="mt-3 font-display text-lg font-medium text-[var(--text-primary)]">
                    No Stem Selected
                  </h3>
                  <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-[var(--text-secondary)]">
                    Click or tap any flower or leaf on the bouquet canvas to inspect, rotate, scale, or layer it.
                  </p>
                </div>

                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Layer Stack ({scene.stems.length} Stems)
                  </h4>
                  <div className="space-y-1.5">
                    {[...scene.stems]
                      .sort((a, b) => b.zIndex - a.zIndex)
                      .map((stem, i) => {
                        const meta = CATALOG_META_MAP.get(stem.skuId);
                        return (
                          <button
                            key={stem.id}
                            type="button"
                            onClick={() => setSelectedIds([stem.id])}
                            className="flex w-full items-center justify-between rounded-lg border border-[var(--border-hairline)] bg-white px-2.5 py-2 text-left text-xs hover:border-[var(--accent-primary)]"
                          >
                            <span className="flex items-center gap-2 font-medium">
                              <span className="w-4 text-[10px] text-[var(--text-muted)]">#{scene.stems.length - i}</span>
                              <span
                                className="h-2.5 w-2.5 rounded-full border border-black/15"
                                style={{ backgroundColor: meta?.colorHex ?? "#999" }}
                              />
                              <span className="line-clamp-1">{meta?.name ?? stem.skuId}</span>
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)]">
                              {stem.locked ? "Locked" : meta?.variantLabel}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </>
            ) : singleStem && singleMeta ? (
              <div className="space-y-4" data-testid="single-stem-inspector">
                <div className="flex items-center gap-3 rounded-xl border border-[var(--border-hairline)] bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={singleMeta.thumbPath}
                    alt={singleMeta.name}
                    className="h-14 w-14 rounded-lg bg-[var(--bg-well)] object-contain p-1"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-lg font-medium">{singleMeta.name}</h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {singleMeta.variantLabel} • {singleMeta.meaningShort}
                    </p>
                  </div>
                </div>

                {/* Morphological & Orientation Variation Switcher */}
                {familyVariants.length > 1 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                      Botanical Stage / Variation
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {familyVariants.map((variant) => {
                        const isCur = variant.skuId === singleStem.skuId;
                        return (
                          <button
                            key={variant.skuId}
                            type="button"
                            disabled={Boolean(singleStem.locked)}
                            onClick={() => swapStemVariation(singleStem.id, variant.skuId)}
                            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                              isCur
                                ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]"
                                : "border-[var(--border-hairline)] bg-white text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                            } disabled:opacity-50`}
                          >
                            {variant.colorAnchor} ({variant.variantLabel})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Replace with any Botanical */}
                <label className="block text-xs font-medium text-[var(--text-secondary)]">
                  Replace With Different Botanical
                  <select
                    disabled={Boolean(singleStem.locked)}
                    value={singleStem.skuId}
                    onChange={(e) => replaceStemSku(singleStem.id, e.target.value)}
                    data-testid="inspector-replace-select"
                    className="mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-white px-2.5 py-1.5 text-xs text-[var(--text-primary)] disabled:opacity-50"
                  >
                    {CATALOG_ENTRIES.map((item) => (
                      <option key={item.skuId} value={item.skuId}>
                        {item.name} ({item.variantLabel})
                      </option>
                    ))}
                  </select>
                </label>

                {/* Scale & Rotation Sliders */}
                <div className="space-y-3 rounded-xl border border-[var(--border-hairline)] bg-white p-3">
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">
                    <div className="mb-1 flex justify-between">
                      <span>Scale</span>
                      <span className="font-mono text-[var(--text-primary)]">{singleStem.scale.toFixed(2)}×</span>
                    </div>
                    <input
                      type="range"
                      min={0.6}
                      max={1.5}
                      step={0.02}
                      disabled={Boolean(singleStem.locked)}
                      value={singleStem.scale}
                      onChange={(e) =>
                        updateStemsTransform([
                          {
                            id: singleStem.id,
                            x: singleStem.x,
                            y: singleStem.y,
                            scale: Number(e.target.value),
                            rotationDeg: singleStem.rotationDeg,
                          },
                        ])
                      }
                      className="w-full accent-[var(--accent-primary)]"
                    />
                  </label>

                  <label className="block text-xs font-medium text-[var(--text-secondary)]">
                    <div className="mb-1 flex justify-between">
                      <span>Angle</span>
                      <span className="font-mono text-[var(--text-primary)]">{singleStem.rotationDeg}°</span>
                    </div>
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      step={1}
                      disabled={Boolean(singleStem.locked)}
                      value={singleStem.rotationDeg}
                      onChange={(e) =>
                        updateStemsTransform([
                          {
                            id: singleStem.id,
                            x: singleStem.x,
                            y: singleStem.y,
                            scale: singleStem.scale,
                            rotationDeg: Number(e.target.value),
                          },
                        ])
                      }
                      className="w-full accent-[var(--accent-primary)]"
                    />
                  </label>
                </div>

                {/* Action Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={Boolean(singleStem.locked)}
                    onClick={() => flipStemsHorizontal([singleStem.id])}
                    className="min-h-[38px] rounded-lg border border-[var(--border-hairline)] bg-white px-3 text-xs font-medium hover:bg-[var(--bg-well)] disabled:opacity-50"
                  >
                    Flip Horizontal
                  </button>
                  <button
                    type="button"
                    data-testid="inspector-lock-btn"
                    onClick={() => toggleLockStems([singleStem.id])}
                    className={`min-h-[38px] rounded-lg border px-3 text-xs font-medium ${
                      singleStem.locked
                        ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                        : "border-[var(--border-hairline)] bg-white hover:bg-[var(--bg-well)]"
                    }`}
                  >
                    {singleStem.locked ? "Unlock Stem" : "Lock Stem"}
                  </button>
                  <button
                    type="button"
                    onClick={() => bringForward([singleStem.id])}
                    className="min-h-[38px] rounded-lg border border-[var(--border-hairline)] bg-white px-3 text-xs font-medium hover:bg-[var(--bg-well)]"
                  >
                    Bring Forward
                  </button>
                  <button
                    type="button"
                    onClick={() => sendBackward([singleStem.id])}
                    className="min-h-[38px] rounded-lg border border-[var(--border-hairline)] bg-white px-3 text-xs font-medium hover:bg-[var(--bg-well)]"
                  >
                    Send Backward
                  </button>
                  {overlapCandidates.length > 1 && (
                    <button
                      type="button"
                      onClick={cycleOverlappingStem}
                      className="col-span-2 min-h-[38px] rounded-lg border border-[var(--accent-primary)]/40 bg-[var(--accent-primary-soft)] px-3 text-xs font-semibold text-[var(--accent-primary)]"
                    >
                      Cycle Overlapping Stem ({overlapCandidates.length} here)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => duplicateStems([singleStem.id])}
                    className="min-h-[38px] rounded-lg border border-[var(--border-hairline)] bg-white px-3 text-xs font-medium hover:bg-[var(--bg-well)]"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStems([singleStem.id])}
                    className="min-h-[38px] rounded-lg border border-[var(--status-error-border)] bg-[var(--status-error-fill)] px-3 text-xs font-medium text-[var(--status-error-ink)]"
                  >
                    Remove Stem
                  </button>
                </div>
              </div>
            ) : (
              /* Multi-Selection Inspector */
              <div className="space-y-3" data-testid="multi-stem-inspector">
                <div className="rounded-xl border border-[var(--accent-primary)]/40 bg-[var(--accent-primary-soft)] p-3">
                  <p className="text-xs font-semibold text-[var(--accent-primary)]">
                    {selectedStems.length} Stems Selected
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                    Drag on canvas to move together, or apply batch actions below.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => bringForward()}
                    className="min-h-[38px] rounded-lg border border-[var(--border-hairline)] bg-white px-3 text-xs font-medium"
                  >
                    Bring Forward
                  </button>
                  <button
                    type="button"
                    onClick={() => sendBackward()}
                    className="min-h-[38px] rounded-lg border border-[var(--border-hairline)] bg-white px-3 text-xs font-medium"
                  >
                    Send Backward
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleLockStems()}
                    className="min-h-[38px] rounded-lg border border-[var(--border-hairline)] bg-white px-3 text-xs font-medium"
                  >
                    Toggle Lock
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateStems()}
                    className="min-h-[38px] rounded-lg border border-[var(--border-hairline)] bg-white px-3 text-xs font-medium"
                  >
                    Duplicate All
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStems()}
                    className="min-h-[38px] rounded-lg border border-[var(--status-error-border)] bg-[var(--status-error-fill)] px-3 text-xs font-medium text-[var(--status-error-ink)]"
                  >
                    Remove Selected
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="min-h-[38px] rounded-lg border border-[var(--border-hairline)] bg-white px-3 text-xs font-medium"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: STYLE, PRESETS & WRAPPING ==================== */}
        {activeTab === "finish" && (
          <div className="space-y-5">
            {/* Occasion-Based Templates (11 Curated Celebrations & Sentiments) */}
            <div
              data-testid="occasion-templates-box"
              className="rounded-xl border border-[var(--border-hairline)] bg-white p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Occasion Templates
                </h3>
                <span className="text-[10px] font-medium text-[var(--text-muted)]">
                  {occasionPreviewSpec.label}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {CORE_ELEVEN_OCCASIONS.map((occ) => {
                  const active = selectedOccasionSlug === occ.slug;
                  return (
                    <button
                      key={occ.slug}
                      type="button"
                      data-testid={`occasion-chip-${occ.slug}`}
                      onClick={() => setSelectedOccasionSlug(occ.slug)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                        active
                          ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                          : "border-[var(--border-hairline)] bg-[var(--bg-well)]/40 text-[var(--text-secondary)] hover:border-[var(--accent-primary)]"
                      }`}
                    >
                      {occ.label}
                    </button>
                  );
                })}
              </div>

              <div
                data-testid="occasion-preview-detail"
                className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-2.5 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    {occasionPreviewSpec.label} — {occasionPreviewSpec.paletteLabel}
                  </p>
                  <div className="flex items-center gap-1">
                    {occasionPreviewSpec.paletteSwatches.map((hex, i) => (
                      <span
                        key={i}
                        className="h-3 w-3 rounded-full border border-black/15"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  {occasionPreviewSpec.tagline}
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Blooms:{" "}
                  {occasionPreviewSpec.recommendedSkuIds
                    .slice(0, 4)
                    .map((sku) => CATALOG_META_MAP.get(sku)?.name ?? sku)
                    .join(" · ")}{" "}
                  • Wrap: {VESSEL_RULES[occasionPreviewSpec.vesselId].label}
                </p>
                <div className="flex gap-1.5 pt-0.5">
                  <button
                    type="button"
                    data-testid="apply-occasion-full-btn"
                    onClick={() => applyOccasionTemplate(selectedOccasionSlug, "full")}
                    className="flex-1 min-h-[32px] rounded-lg bg-[var(--accent-primary)] px-2.5 text-[11px] font-semibold text-white hover:bg-[var(--accent-primary-hover)]"
                  >
                    Apply {occasionPreviewSpec.label} Bouquet
                  </button>
                  <button
                    type="button"
                    data-testid="apply-occasion-style-btn"
                    onClick={() => applyOccasionTemplate(selectedOccasionSlug, "style-only")}
                    className="min-h-[32px] rounded-lg border border-[var(--border-hairline)] bg-white px-2.5 text-[11px] font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                  >
                    Wrap &amp; Card Only
                  </button>
                </div>
              </div>
            </div>

            {/* Automatic Arrangement Suggestions */}
            <div
              data-testid="smart-suggestions-box"
              className="rounded-xl border border-[var(--accent-primary)]/25 bg-[var(--accent-primary-soft)]/50 p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                  Smart Studio Suggestions
                </h3>
                <button
                  type="button"
                  data-testid="apply-suggested-shape-btn"
                  onClick={() => applyCompositionPreset(smartSuggestions.recommendedPreset)}
                  className="rounded-full bg-[var(--accent-primary)] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[var(--accent-primary-hover)]"
                >
                  Apply {COMPOSITION_PRESET_LABELS[smartSuggestions.recommendedPreset].label}
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
                {smartSuggestions.presetReason}
              </p>
              {smartSuggestions.complementaryStems.length > 0 && (
                <div className="space-y-1 border-t border-[var(--border-hairline)] pt-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Recommended Accent Additions
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {smartSuggestions.complementaryStems.map((sugg) => (
                      <SuggestionAddChip key={sugg.skuId} skuId={sugg.skuId} name={sugg.name} reason={sugg.reason} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Curated Starters */}
            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Curated Recipes
              </h3>
              <select
                aria-label="Load starter bouquet recipe"
                value={activePresetId}
                onChange={(e) => loadStarterPreset(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-hairline)] bg-white px-3 py-2 text-xs font-medium"
              >
                {STARTER_BOUQUETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {p.subtitle}
                  </option>
                ))}
              </select>
            </div>

            {/* 7 Composition Arrangement Presets */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Composition Geometry
                </h3>
                <button
                  type="button"
                  onClick={resetArrangement}
                  className="text-xs font-medium text-[var(--accent-primary)] underline"
                >
                  Re-arrange Cleanly
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {COMPOSITION_PRESET_IDS.map((pid) => {
                  const active = scene.presentation.compositionPreset === pid;
                  const meta = COMPOSITION_PRESET_LABELS[pid];
                  return (
                    <button
                      key={pid}
                      type="button"
                      data-testid={`preset-${pid}`}
                      onClick={() => applyCompositionPreset(pid)}
                      className={`rounded-lg border px-2.5 py-2 text-left transition ${
                        active
                          ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]"
                          : "border-[var(--border-hairline)] bg-white text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      <div className="text-xs font-semibold">{meta.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Wrapping Paper & Vessels */}
            <div data-testid="wrapping-studio-box">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Bouquet Wrapping Studio
                </h3>
                <span className="text-[10px] text-[var(--text-muted)]">Behind flowers + front collar</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {VESSEL_IDS.map((vid) => {
                  const rule = VESSEL_RULES[vid];
                  const active = scene.presentation.vesselId === vid;
                  return (
                    <button
                      key={vid}
                      type="button"
                      data-testid={`vessel-${vid}`}
                      onClick={() => setVessel(vid)}
                      className={`flex flex-col items-start rounded-xl border p-2 text-left transition ${
                        active
                          ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)]"
                          : "border-[var(--border-hairline)] bg-white hover:border-[var(--border-strong)]"
                      }`}
                    >
                      <span
                        className="mb-1.5 h-5 w-full rounded border border-black/10"
                        style={{
                          background:
                            vid === "wrap-transparent-cellophane"
                              ? "linear-gradient(135deg, #FFFFFF 0%, #D9ECEB 50%, #F7FCFC 100%)"
                              : vid === "wrap-floral-patterned"
                                ? "radial-gradient(circle at 30% 45%, #D99AA4 18%, transparent 20%), radial-gradient(circle at 70% 55%, #7E9C82 16%, transparent 18%), #F2E9DD"
                                : vid === "wrap-textured-weave"
                                  ? "repeating-linear-gradient(45deg, #DFD7C8 0px, #DFD7C8 4px, #CFC6B4 4px, #CFC6B4 6px)"
                                  : rule.swatchHex,
                        }}
                      />
                      <span className="line-clamp-2 text-[11px] font-medium leading-tight">
                        {rule.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stem Visibility */}
            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Stem Visibility
              </h3>
              <div className="grid grid-cols-3 gap-1.5">
                {STEM_VISIBILITY_IDS.map((sv) => {
                  const allowed = vesselRule.allowedStemVisibility.includes(sv);
                  const active = scene.presentation.stemVisibility === sv;
                  return (
                    <button
                      key={sv}
                      type="button"
                      disabled={!allowed}
                      onClick={() => setStemVisibility(sv)}
                      className={`min-h-[36px] rounded-lg border px-2 text-xs font-medium capitalize transition ${
                        active
                          ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                          : "border-[var(--border-hairline)] bg-white text-[var(--text-secondary)]"
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      {sv}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bow Style, Ribbon Material Finish & Color */}
            {vesselRule.supportsBow && (
              <div className="space-y-3">
                <div>
                  <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Ribbon Material Finish
                  </h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    {RIBBON_FINISH_IDS.map((rf) => {
                      const active = (scene.presentation.ribbonFinishId ?? "satin") === rf;
                      return (
                        <button
                          key={rf}
                          type="button"
                          data-testid={`ribbon-finish-${rf}`}
                          onClick={() => setRibbonFinish(rf)}
                          className={`min-h-[34px] rounded-lg border px-2 text-xs font-medium transition ${
                            active
                              ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] text-[var(--accent-primary)] font-semibold"
                              : "border-[var(--border-hairline)] bg-white text-[var(--text-secondary)]"
                          }`}
                        >
                          {RIBBON_FINISH_LABELS[rf]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Bow &amp; Closure Style
                  </h3>
                  <div className="grid grid-cols-3 gap-1.5">
                    {BOW_STYLE_IDS.map((bid) => {
                      const active = scene.presentation.bowStyleId === bid;
                      return (
                        <button
                          key={bid}
                          type="button"
                          data-testid={`bow-style-${bid}`}
                          onClick={() => setBowStyle(bid)}
                          className={`min-h-[36px] rounded-lg border px-2 text-xs font-medium transition ${
                            active
                              ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]"
                              : "border-[var(--border-hairline)] bg-white text-[var(--text-secondary)]"
                          }`}
                        >
                          {BOW_LABELS[bid]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {scene.presentation.bowStyleId !== "none" && (
                  <div>
                    <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Ribbon Color &amp; Twine
                    </h3>
                    <div className="grid grid-cols-3 gap-1.5">
                      {RIBBON_COLOR_IDS.map((rc) => {
                        const meta = RIBBON_SWATCHES[rc];
                        const active = scene.presentation.ribbonColorId === rc;
                        return (
                          <button
                            key={rc}
                            type="button"
                            data-testid={`ribbon-color-${rc}`}
                            onClick={() => setRibbonColor(rc)}
                            className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-[11px] font-medium ${
                              active
                                ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)]"
                                : "border-[var(--border-hairline)] bg-white"
                            }`}
                          >
                            <span
                              className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/20"
                              style={{ backgroundColor: meta.hex }}
                            />
                            <span className="truncate">{meta.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tabletop Backdrop */}
            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Tabletop Surface
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {TABLE_SURFACE_IDS.map((sid) => {
                  const t = TABLE_SURFACE_THEMES[sid];
                  const active = scene.presentation.tableSurfaceId === sid;
                  return (
                    <button
                      key={sid}
                      type="button"
                      data-testid={`surface-${sid}`}
                      onClick={() => setTableSurface(sid)}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-medium ${
                        active
                          ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)]"
                          : "border-[var(--border-hairline)] bg-white"
                      }`}
                    >
                      <span
                        className="h-4 w-4 shrink-0 rounded border border-black/20"
                        style={{ backgroundColor: t.swatch }}
                      />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {onNavigateStep && (
              <div className="flex items-center gap-2 border-t border-[var(--border-hairline)] pt-3">
                <button
                  type="button"
                  onClick={() => onNavigateStep(2)}
                  className="min-h-[38px] rounded-xl border border-[var(--border-hairline)] px-3 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-well)]"
                >
                  ← Greenery
                </button>
                <button
                  type="button"
                  data-testid="next-to-card-btn"
                  onClick={() => onNavigateStep(4)}
                  className="min-h-[38px] flex-1 rounded-xl bg-[var(--accent-primary)] px-3 text-xs font-semibold text-white hover:bg-[var(--accent-primary-hover)]"
                >
                  Next: Personalize Card →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: GREETING CARD EDITOR ==================== */}
        {activeTab === "card" && (
          <div className="space-y-4">
            {/* Scaled Live Card Preview */}
            <div className="space-y-2">
              <div
                data-testid="card-live-preview"
                className={`relative mx-auto aspect-[4/5] w-full overflow-hidden rounded-xl border p-5 shadow-sm transition-colors ${
                  fullCardModalOpen ? "max-w-[320px]" : "max-w-[260px]"
                } ${cardAppearance.frameRule === "double" ? "ring-1 ring-inset ring-current/25" : ""}`}
                style={{
                  backgroundColor: cardAppearance.backgroundColor,
                  color: cardAppearance.textColor,
                  borderColor: cardAppearance.borderColor,
                  textAlign: scene.card.textAlign,
                }}
              >
                {scene.card.showPressedPetalWatermark && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-4 -bottom-4 h-24 w-24 rounded-full opacity-15 blur-xs"
                    style={{ backgroundColor: "#E8A9AE" }}
                  />
                )}
                <div className="flex h-full flex-col justify-between">
                  <div
                    className="text-xs"
                    style={{ fontFamily: cardPreview.fonts.displayFont, color: cardAppearance.mutedColor }}
                  >
                    {scene.card.recipientName ? `Dear ${scene.card.recipientName},` : "For Someone Special,"}
                  </div>
                  <div className="my-auto py-2">
                    {scene.card.isVisualOnly ? (
                      <p className="text-xs italic" style={{ color: cardAppearance.mutedColor }}>
                        (No message card attached — Bouquet Only)
                      </p>
                    ) : (
                      <div
                        className="space-y-1 leading-snug"
                        style={{
                          fontFamily: cardPreview.fonts.bodyFont,
                          fontSize: `${Math.max(11, Math.round(cardPreview.wrapped.fontSizePx * (fullCardModalOpen ? 0.78 : 0.65)))}px`,
                        }}
                      >
                        {(scene.card.message.trim()
                          ? cardPreview.wrapped.lines.slice(0, 10)
                          : ["Your heartfelt note will appear here…"]
                        ).map((ln, idx) => (
                          <div key={idx}>{ln}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div
                    className="flex items-center justify-between text-xs"
                    style={{ fontFamily: cardPreview.fonts.displayFont, color: cardAppearance.mutedColor }}
                  >
                    <span>{scene.card.senderName ? `With warmth, ${scene.card.senderName}` : ""}</span>
                    <span
                      className="inline-block h-4 w-4 rounded-full border border-white/30"
                      style={{ backgroundColor: WAX_SWATCHES[scene.card.waxSealColorId].hex }}
                      title={`Wax seal: ${WAX_SWATCHES[scene.card.waxSealColorId].label}`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  data-testid="toggle-large-card-preview"
                  onClick={() => setFullCardModalOpen((p) => !p)}
                  className="text-[11px] font-medium text-[var(--accent-primary)] underline"
                >
                  {fullCardModalOpen ? "Compact Card Preview" : "Expand Card Preview"}
                </button>
              </div>
            </div>

            {hasBlankMessageWarning && (
              <p
                data-testid="card-validation-msg"
                className="rounded-lg border border-[var(--status-warning-border)] bg-[var(--status-warning-fill)] px-3 py-2 text-xs text-[var(--status-warning-ink)]"
              >
                Write a personal note below or check &ldquo;Send as Bouquet Only&rdquo;.
              </p>
            )}

            {cardPreview.wrapped.exceedsMaxLines && !scene.card.isVisualOnly && (
              <p className="rounded-lg border border-[var(--status-warning-border)] bg-[var(--status-warning-fill)] px-3 py-2 text-xs text-[var(--status-warning-ink)]">
                {UI_COPY.cardOverflowWarning}
              </p>
            )}

            <label className="flex items-center gap-2 text-xs font-medium">
              <input
                type="checkbox"
                checked={scene.card.isVisualOnly}
                onChange={(e) => updateCard({ isVisualOnly: e.target.checked })}
                className="rounded accent-[var(--accent-primary)]"
              />
              Send as Bouquet Only (omit personal note card)
            </label>

            {!scene.card.isVisualOnly && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">
                    Recipient Name
                    <input
                      type="text"
                      maxLength={40}
                      value={scene.card.recipientName}
                      onChange={(e) => updateCard({ recipientName: e.target.value })}
                      placeholder="e.g. Clara"
                      className="mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-white px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                    />
                  </label>
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">
                    Sender Name
                    <input
                      type="text"
                      maxLength={40}
                      value={scene.card.senderName}
                      onChange={(e) => updateCard({ senderName: e.target.value })}
                      placeholder="e.g. Theo"
                      className="mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-white px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">
                    Personal Note
                    <textarea
                      rows={4}
                      maxLength={600}
                      value={scene.card.message}
                      onChange={(e) => updateCard({ message: e.target.value })}
                      placeholder="Write a heartfelt message…"
                      className="mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-white px-2.5 py-2 text-xs leading-relaxed text-[var(--text-primary)]"
                    />
                  </label>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {CARD_MESSAGE_STARTERS.map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => updateCard({ message: s.text })}
                        className="rounded-full border border-[var(--border-hairline)] bg-[var(--bg-well)]/60 px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                      >
                        + {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                    Card Template
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CARD_TEMPLATE_IDS.map((tid) => {
                      const active = scene.card.templateId === tid;
                      return (
                        <button
                          key={tid}
                          type="button"
                          data-testid={`card-template-${tid}`}
                          onClick={() => updateCard({ templateId: tid, envelopeId: tid })}
                          className={`rounded-lg border px-2 py-1.5 text-left text-[11px] font-medium ${
                            active
                              ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)]"
                              : "border-[var(--border-hairline)] bg-white"
                          }`}
                        >
                          {CARD_TEMPLATE_META[tid].label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Card Paper Background */}
                <div>
                  <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                    Card Background Color
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PAPER_TINT_IDS.map((pid) => {
                      const meta = PAPER_TINT_STYLES[pid];
                      const active = scene.card.paperTintId === pid;
                      return (
                        <button
                          key={pid}
                          type="button"
                          data-testid={`card-bg-${pid}`}
                          onClick={() => updateCard({ paperTintId: pid })}
                          className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] ${
                            active
                              ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] font-semibold"
                              : "border-[var(--border-hairline)] bg-white"
                          }`}
                        >
                          <span
                            className="h-3 w-3 rounded-full border border-black/20"
                            style={{ backgroundColor: meta.bg }}
                          />
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Text Ink Color */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--text-secondary)]">Text Color</span>
                    {cardAppearance.autoContrastAdjusted && (
                      <span className="text-[10px] text-[var(--text-muted)]">
                        Auto-adjusted for legibility
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {CARD_TEXT_COLOR_IDS.map((cid) => {
                      const meta = CARD_TEXT_COLOR_STYLES[cid];
                      const active = (scene.card.textColorId ?? "charcoal") === cid;
                      return (
                        <button
                          key={cid}
                          type="button"
                          data-testid={`card-ink-${cid}`}
                          onClick={() => updateCard({ textColorId: cid })}
                          className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] ${
                            active
                              ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] font-semibold"
                              : "border-[var(--border-hairline)] bg-white"
                          }`}
                        >
                          <span
                            className="h-3 w-3 rounded-full border border-black/20"
                            style={{ backgroundColor: meta.swatch }}
                          />
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">
                    Typography
                    <select
                      value={scene.card.fontPairingId}
                      onChange={(e) =>
                        updateCard({ fontPairingId: e.target.value as (typeof FONT_PAIRING_IDS)[number] })
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-white px-2 py-1.5 text-xs text-[var(--text-primary)]"
                    >
                      {FONT_PAIRING_IDS.map((fid) => (
                        <option key={fid} value={fid}>
                          {formatSlugLabel(fid)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">
                    Alignment
                    <select
                      value={scene.card.textAlign}
                      onChange={(e) =>
                        updateCard({ textAlign: e.target.value as "left" | "center" | "right" })
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-white px-2 py-1.5 text-xs text-[var(--text-primary)]"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </label>
                </div>

                <div>
                  <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                    Wax Envelope Seal
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {WAX_SEAL_COLOR_IDS.map((wid) => {
                      const active = scene.card.waxSealColorId === wid;
                      return (
                        <button
                          key={wid}
                          type="button"
                          onClick={() => updateCard({ waxSealColorId: wid })}
                          className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${
                            active
                              ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] font-semibold"
                              : "border-[var(--border-hairline)] bg-white"
                          }`}
                        >
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: WAX_SWATCHES[wid].hex }}
                          />
                          {WAX_SWATCHES[wid].label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="block text-xs font-medium text-[var(--text-secondary)]">
                  Unboxing Soundscape
                  <select
                    value={scene.card.audioTrackId}
                    onChange={(e) =>
                      updateCard({ audioTrackId: e.target.value as (typeof AUDIO_TRACK_IDS)[number] })
                    }
                    className="mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-white px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                  >
                    {AUDIO_TRACK_IDS.map((aid) => (
                      <option key={aid} value={aid}>
                        {formatSlugLabel(aid)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={scene.card.showPressedPetalWatermark}
                    onChange={(e) => updateCard({ showPressedPetalWatermark: e.target.checked })}
                    className="rounded accent-[var(--accent-primary)]"
                  />
                  Show pressed petal card watermark
                </label>
              </div>
            )}

            <div className="space-y-3 border-t border-[var(--border-hairline)] pt-3">
              <PhotoCropperAttachment />
              <VoiceMessageRecorder />
            </div>

            {onNavigateStep && (
              <div className="flex items-center gap-2 border-t border-[var(--border-hairline)] pt-3">
                <button
                  type="button"
                  onClick={() => onNavigateStep(3)}
                  className="min-h-[38px] rounded-xl border border-[var(--border-hairline)] px-3 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-well)]"
                >
                  ← Arrange
                </button>
                <button
                  type="button"
                  data-testid="next-to-share-btn"
                  onClick={() => onNavigateStep(5)}
                  className="min-h-[38px] flex-1 rounded-xl bg-[var(--accent-primary)] px-3 text-xs font-semibold text-white hover:bg-[var(--accent-primary-hover)]"
                >
                  Next: Final Preview & Share →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 4: EXPORT & SHARE ==================== */}
        {activeTab === "share" && (
          <ShareAndExportControls
            onEditStems={onNavigateStep ? () => onNavigateStep(1) : undefined}
            onEditCard={() => {
              onTabChange("card");
              if (onNavigateStep) onNavigateStep(4);
            }}
            onAfterReset={onNavigateStep ? () => onNavigateStep(1) : undefined}
          />
        )}
      </div>
    </div>
  );
}

function SuggestionAddChip({
  skuId,
  name,
  reason,
}: {
  skuId: string;
  name: string;
  reason: string;
}) {
  const { addStem } = useStudioScene();
  return (
    <button
      type="button"
      title={reason}
      onClick={() => addStem(skuId)}
      data-testid={`suggest-add-${skuId}`}
      className="rounded-full border border-[var(--accent-primary)]/35 bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary-soft)]"
    >
      + {name}
    </button>
  );
}
