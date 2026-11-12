"use client";

import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  AUDIO_TRACK_IDS,
  BOW_STYLE_IDS,
  CARD_TEMPLATE_IDS,
  CARD_TEXT_COLOR_IDS,
  CARD_TEXT_COLOR_STYLES,
  COMPOSITION_PRESET_IDS,
  FONT_PAIRING_IDS,
  MIN_STEMS_MINIMALIST,
  MIN_STEMS_STANDARD,
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
import {
  EXPORT_DIMENSIONS,
  ExportAspectPreset,
  TABLE_SURFACE_THEMES,
  exportBouquetBlob,
} from "@/engine/canvas-renderer";
import { createDomTextMeasurer, getCardFontFamilies, wrapCardMessage } from "@/lib/card-layout";
import { CARD_MESSAGE_STARTERS, CARD_TEMPLATE_META, resolveCardAppearance } from "@/lib/card-styles";
import { PhotoCropperAttachment } from "./PhotoCropperAttachment";
import { VoiceMessageRecorder } from "./VoiceMessageRecorder";
import { useStudioScene } from "./StudioSceneProvider";
import { trackPrivacySafeEvent } from "@/lib/analytics";

export type RightPanelTab = "inspect" | "finish" | "card" | "share";

const FAMILY_MAP = new Map(BOTANICAL_FAMILIES);

const RIBBON_SWATCHES: Record<(typeof RIBBON_COLOR_IDS)[number], { label: string; hex: string }> = {
  "silk-cream": { label: "Silk Cream", hex: "#EFE6D4" },
  "velvet-burgundy": { label: "Velvet Burgundy", hex: "#781E2B" },
  "sage-satin": { label: "Sage Satin", hex: "#78927B" },
  "champagne-gold": { label: "Champagne Gold", hex: "#CFB17C" },
  "dusty-rose": { label: "Dusty Rose", hex: "#CA8E95" },
  "natural-twine": { label: "Natural Twine", hex: "#A78A64" },
};

const BOW_LABELS: Record<(typeof BOW_STYLE_IDS)[number], string> = {
  "double-bow": "Decorative Double Bow",
  "silk-tails": "Silk Tails",
  "minimal-knot": "Minimal Knot",
  "wax-band": "Wax Band",
  none: "No Ribbon",
};

const RIBBON_FINISH_LABELS: Record<RibbonFinishId, string> = {
  satin: "Satin Ribbon",
  silk: "Silk Ribbon",
  velvet: "Velvet Ribbon",
  twine: "Natural Twine",
};

const WAX_SWATCHES: Record<(typeof WAX_SEAL_COLOR_IDS)[number], { label: string; hex: string }> = {
  "terracotta-rose": { label: "Terracotta", hex: "#A8564B" },
  "antique-gold": { label: "Antique Gold", hex: "#B59145" },
  "forest-pine": { label: "Forest Pine", hex: "#35513D" },
  "ivory-pearl": { label: "Ivory Pearl", hex: "#E6DFD2" },
  "midnight-ink": { label: "Midnight Ink", hex: "#23252C" },
  champagne: { label: "Champagne", hex: "#CBB084" },
};

function formatSlugLabel(str: string): string {
  return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

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
    startNewBouquet,
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
    shareState,
    isPublishing,
    publishError,
    clearPublishError,
    publishShareLink,
  } = useStudioScene();

  const [exportAspect, setExportAspect] = useState<ExportAspectPreset>("square");
  const [includeNoteInExport, setIncludeNoteInExport] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<"png" | "jpg" | null>(null);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareActionFeedback, setShareActionFeedback] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
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
  const minStemsRequired =
    scene.presentation.compositionPreset === "minimalist"
      ? MIN_STEMS_MINIMALIST
      : MIN_STEMS_STANDARD;
  const hasEnoughStems = scene.stems.length >= minStemsRequired;
  const hasBlankMessageWarning = !scene.card.isVisualOnly && scene.card.message.trim().length === 0;

  // Live QR code generation whenever share link updates
  useEffect(() => {
    if (!shareState || typeof window === "undefined") {
      setQrDataUrl(null);
      return;
    }
    const fullUrl = `${window.location.origin}${shareState.shareUrl}`;
    QRCode.toDataURL(fullUrl, { width: 220, margin: 1, color: { dark: "#1F241F", light: "#FDFBF7" } })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(null));
  }, [shareState]);

  const cardPreview = useMemo(() => {
    const fonts = getCardFontFamilies(scene.card.fontPairingId);
    const measurer = createDomTextMeasurer();
    const wrapped = wrapCardMessage(measurer, scene.card.message, 460, fonts.bodyFont);
    return { fonts, wrapped };
  }, [scene.card.fontPairingId, scene.card.message]);

  const handleDownloadExport = async (mime: "image/png" | "image/jpeg") => {
    const fmt = mime === "image/png" ? "png" : "jpg";
    setExportingFormat(fmt);
    setExportFeedback(null);
    setExportError(null);
    try {
      const effectiveAspect: ExportAspectPreset =
        mime === "image/jpeg" && exportAspect === "transparent" ? "square" : exportAspect;
      const res = await exportBouquetBlob(scene, CATALOG_META_MAP, {
        aspect: effectiveAspect,
        mimeType: mime,
        includeCardNote: includeNoteInExport,
        includeColophon: scene.showColophon,
      });

      const url = URL.createObjectURL(res.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = res.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      trackPrivacySafeEvent(fmt === "png" ? "export_png" : "export_jpg");
      setExportFeedback(`Downloaded ${res.filename} (${res.width}×${res.height})`);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExportingFormat(null);
    }
  };

  const getFullShareUrl = () => {
    if (!shareState || typeof window === "undefined") return "";
    return `${window.location.origin}${shareState.shareUrl}`;
  };

  const handleCopyShareLink = async () => {
    const fullUrl = getFullShareUrl();
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setShareActionFeedback("Share link copied to clipboard.");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setShareActionFeedback("Could not copy automatically—use the URL field above.");
    }
  };

  const handleNativeShare = async () => {
    const fullUrl = getFullShareUrl();
    if (!fullUrl) return;
    const shareTitle = scene.card.recipientName
      ? `A digital bouquet for ${scene.card.recipientName}`
      : "A custom digital bouquet from Petal & Prose";
    const shareText = "I arranged a digital bouquet with a personal note for you:";

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: fullUrl });
        setShareActionFeedback("Opened native device share sheet.");
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    await handleCopyShareLink();
    setShareActionFeedback("Link copied (native share unavailable in this desktop browser).");
  };

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
                <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-well)]/50 p-3.5">
                  <h3 className="font-display text-lg font-medium">Canvas Stem Inspector</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                    Click any flower or leaf on the bouquet canvas to adjust scale, angle, blooming stage
                    variation, layer order, or lock position. Hold Shift to select multiple stems.
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
          <div className="space-y-4">
            {/* Validation Checks */}
            {!hasEnoughStems && (
              <div
                data-testid="share-validation-banner"
                className="rounded-xl border border-[var(--status-error-border)] bg-[var(--status-error-fill)] p-3 text-xs text-[var(--status-error-ink)]"
              >
                <p className="font-semibold">More stems needed before sharing</p>
                <p className="mt-0.5">
                  Please add at least {minStemsRequired} stems for this bouquet style before creating a
                  shareable keepsake link.
                </p>
                {onNavigateStep && (
                  <button
                    type="button"
                    onClick={() => onNavigateStep(1)}
                    className="mt-2 font-semibold underline"
                  >
                    Return to Step 1 (Flowers) →
                  </button>
                )}
              </div>
            )}

            {hasBlankMessageWarning && (
              <div className="rounded-xl border border-[var(--status-warning-border)] bg-[var(--status-warning-fill)] p-3 text-xs text-[var(--status-warning-ink)]">
                <p>Your greeting card message is blank. Recipients will see an empty note unless you add one or toggle Bouquet Only.</p>
                <button
                  type="button"
                  onClick={() => {
                    onTabChange("card");
                    if (onNavigateStep) onNavigateStep(4);
                  }}
                  className="mt-1 font-semibold underline"
                >
                  Edit Card Message →
                </button>
              </div>
            )}

            {/* Publish & Multi-Channel Share */}
            <div className="rounded-xl border border-[var(--border-hairline)] bg-white p-3.5 space-y-3">
              <h3 className="font-display text-lg font-medium">Share Keepsake Unboxing Link</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Generate a private link so your recipient can unbox this bouquet with your custom card.
              </p>

              <label className="flex items-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-well)]/40 px-2.5 py-2 text-xs text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  data-testid="toggle-animated-reveal"
                  checked={scene.card.enableAnimatedReveal !== false}
                  onChange={(e) => updateCard({ enableAnimatedReveal: e.target.checked })}
                  className="rounded accent-[var(--accent-primary)]"
                />
                <span>Include animated wax-seal envelope reveal</span>
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-well)]/40 px-2.5 py-2 text-xs text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  data-testid="toggle-hide-names-share"
                  checked={Boolean(scene.hideNamesInPreview)}
                  onChange={(e) => setHideNamesInPreview(e.target.checked)}
                  className="rounded accent-[var(--accent-primary)]"
                />
                <span>Hide recipient &amp; sender names in link previews &amp; search tags</span>
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-well)]/40 px-2.5 py-2 text-xs text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  data-testid="toggle-public-showcase"
                  disabled={Boolean(scene.hideNamesInPreview)}
                  checked={Boolean(scene.isPublicShowcase) && !scene.hideNamesInPreview}
                  onChange={(e) => setIsPublicShowcase(e.target.checked)}
                  className="rounded accent-[var(--accent-primary)] disabled:opacity-50"
                />
                <span className={scene.hideNamesInPreview ? "opacity-60" : ""}>
                  Opt in to feature in public Gallery showcase (otherwise private link, noindex)
                </span>
              </label>

              {shareState?.isStale && (
                <div className="rounded-lg border border-[var(--status-warning-border)] bg-[var(--status-warning-fill)] px-3 py-2 text-xs text-[var(--status-warning-ink)]">
                  {UI_COPY.shareStaleMessage}
                </div>
              )}

              {publishError && (
                <div
                  data-testid="publish-error-banner"
                  className="rounded-lg border border-[var(--status-error-border)] bg-[var(--status-error-fill)] px-3 py-2 text-xs text-[var(--status-error-ink)]"
                >
                  <p>{publishError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      clearPublishError();
                      void publishShareLink();
                    }}
                    className="mt-1 font-semibold underline"
                  >
                    Retry Publish
                  </button>
                </div>
              )}

              <button
                type="button"
                data-testid="publish-share-btn"
                disabled={isPublishing || !hasEnoughStems}
                onClick={publishShareLink}
                className="w-full min-h-[42px] rounded-xl bg-[var(--accent-primary)] px-4 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isPublishing
                  ? "Sealing Envelope…"
                  : shareState
                    ? shareState.isStale
                      ? "Generate Updated Share Link"
                      : "Create Another Snapshot Link"
                    : "Create Shareable Bouquet Link"}
              </button>

              {shareState && (
                <div className="space-y-2.5 pt-1" data-testid="share-result-box">
                  <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-well)]/50 p-2">
                    <span className="flex-1 truncate font-mono text-xs">{shareState.shareUrl}</span>
                    <button
                      type="button"
                      data-testid="copy-share-link-btn"
                      onClick={handleCopyShareLink}
                      className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold shadow-2xs hover:bg-[var(--bg-well)]"
                    >
                      {copiedLink ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      data-testid="share-whatsapp-btn"
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `${scene.card.recipientName ? `Hi ${scene.card.recipientName}, ` : ""}I arranged a digital bouquet for you on Petal & Prose: ${getFullShareUrl()}`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-[36px] items-center justify-center rounded-lg border border-[var(--border-hairline)] bg-white px-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                    >
                      WhatsApp
                    </a>
                    <button
                      type="button"
                      data-testid="share-native-btn"
                      onClick={handleNativeShare}
                      className="min-h-[36px] rounded-lg border border-[var(--border-hairline)] bg-white px-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                    >
                      Mobile Share
                    </button>
                  </div>

                  {shareActionFeedback && (
                    <p className="text-[11px] font-medium text-[var(--accent-primary)]">
                      {shareActionFeedback}
                    </p>
                  )}

                  <a
                    href={shareState.shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[38px] w-full items-center justify-center rounded-lg border border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] text-xs font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white"
                  >
                    Open Live Unboxing Page →
                  </a>

                  {qrDataUrl && (
                    <div className="flex flex-col items-center rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrDataUrl} alt="Bouquet QR Code" className="h-32 w-32" />
                      <a
                        href={qrDataUrl}
                        download={`petal-prose-qr-${shareState.slug}.png`}
                        className="mt-2 text-xs font-medium text-[var(--accent-primary)] underline"
                      >
                        Download Printable QR Code
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* High-Res Studio Image Export (PNG & JPG) */}
            <div className="rounded-xl border border-[var(--border-hairline)] bg-white p-3.5 space-y-3">
              <h3 className="font-display text-lg font-medium">Download Keepsake Image</h3>

              <div className="space-y-1.5">
                {(Object.keys(EXPORT_DIMENSIONS) as ExportAspectPreset[]).map((aspect) => {
                  const meta = EXPORT_DIMENSIONS[aspect];
                  const active = exportAspect === aspect;
                  return (
                    <button
                      key={aspect}
                      type="button"
                      onClick={() => setExportAspect(aspect)}
                      className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-xs transition ${
                        active
                          ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] font-semibold text-[var(--accent-primary)]"
                          : "border-[var(--border-hairline)] bg-[var(--bg-well)]/30 text-[var(--text-secondary)]"
                      }`}
                    >
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1.5 pt-1 text-xs text-[var(--text-secondary)]">
                {exportAspect !== "transparent" && (
                  <>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={includeNoteInExport}
                        onChange={(e) => setIncludeNoteInExport(e.target.checked)}
                        className="rounded accent-[var(--accent-primary)]"
                      />
                      Print personal card message beneath bouquet
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={scene.showColophon}
                        onChange={(e) => setShowColophon(e.target.checked)}
                        className="rounded accent-[var(--accent-primary)]"
                      />
                      Include Petal & Prose studio signature
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={scene.hideNamesInPreview}
                        onChange={(e) => setHideNamesInPreview(e.target.checked)}
                        className="rounded accent-[var(--accent-primary)]"
                      />
                      Hide sender name in image export
                    </label>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  data-testid="export-download-btn"
                  disabled={exportingFormat !== null}
                  onClick={() => handleDownloadExport("image/png")}
                  className="min-h-[40px] rounded-xl bg-[var(--accent-primary)] px-3 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)] disabled:opacity-60"
                >
                  {exportingFormat === "png" ? "Rendering PNG…" : "Download PNG"}
                </button>
                <button
                  type="button"
                  data-testid="export-download-jpg-btn"
                  disabled={exportingFormat !== null}
                  onClick={() => handleDownloadExport("image/jpeg")}
                  className="min-h-[40px] rounded-xl border border-[var(--accent-primary)] bg-white px-3 text-xs font-semibold text-[var(--accent-primary)] transition hover:bg-[var(--accent-primary-soft)] disabled:opacity-60"
                >
                  {exportingFormat === "jpg" ? "Rendering JPG…" : "Download JPG"}
                </button>
              </div>

              {exportFeedback && (
                <p
                  data-testid="export-feedback"
                  className="rounded-lg bg-[var(--status-success-fill)] px-2.5 py-2 text-xs text-[var(--status-success-ink)]"
                >
                  {exportFeedback}
                </p>
              )}
              {exportError && (
                <p className="rounded-lg bg-[var(--status-error-fill)] px-2.5 py-2 text-xs text-[var(--status-error-ink)]">
                  {exportError}
                </p>
              )}
            </div>

            {/* Start Another Bouquet (guarded against accidental data loss) */}
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-well)]/40 p-3.5">
              {!confirmResetOpen ? (
                <button
                  type="button"
                  data-testid="start-another-btn"
                  onClick={() => setConfirmResetOpen(true)}
                  className="min-h-[38px] w-full rounded-xl border border-[var(--border-hairline)] bg-white px-3 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                >
                  Start Another Bouquet
                </button>
              ) : (
                <div className="space-y-2" data-testid="confirm-new-bouquet-box">
                  <p className="text-xs text-[var(--text-secondary)]">
                    Start a fresh bouquet? Your current work can still be recovered with Undo.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      data-testid="confirm-new-bouquet-btn"
                      onClick={() => {
                        startNewBouquet();
                        setConfirmResetOpen(false);
                        if (onNavigateStep) onNavigateStep(1);
                      }}
                      className="min-h-[34px] flex-1 rounded-lg bg-[var(--accent-primary)] px-2 text-xs font-semibold text-white"
                    >
                      Yes, Start Fresh
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmResetOpen(false)}
                      className="min-h-[34px] rounded-lg border border-[var(--border-hairline)] bg-white px-3 text-xs font-medium"
                    >
                      Keep Editing
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
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
