"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  BOW_STYLE_IDS,
  CARD_TEMPLATE_IDS,
  COMPOSITION_PRESET_IDS,
  CompositionPresetId,
  RIBBON_COLOR_IDS,
  RIBBON_FINISH_IDS,
  TABLE_SURFACE_IDS,
  VESSEL_IDS,
} from "@/engine/types";
import { CATALOG_ENTRIES, CATALOG_META_MAP } from "@/generated/catalog-manifest";
import { COMPOSITION_PRESET_LABELS } from "@/engine/presets";
import { CARD_MESSAGE_STARTERS, CARD_TEMPLATE_META } from "@/lib/card-styles";
import {
  BOW_LABELS,
  RIBBON_FINISH_LABELS,
  RIBBON_SWATCHES,
  formatSlugLabel,
} from "@/lib/studio-labels";
import { exportBouquetBlob } from "@/engine/canvas-renderer";
import { trackPrivacySafeEvent } from "@/lib/analytics";
import { BouquetCanvasDisplay } from "@/components/unboxing/BouquetCanvasDisplay";
import { StudioCanvasViewport } from "./StudioCanvasViewport";
import { PhotoCropperAttachment } from "./PhotoCropperAttachment";
import { VoiceMessageRecorder } from "./VoiceMessageRecorder";
import { SavedProjectsDrawer } from "./SavedProjectsDrawer";
import { useStudioScene } from "./StudioSceneProvider";

export type GuidedStep = 1 | 2 | 3 | 4;

const GUIDED_STEPS: ReadonlyArray<{
  step: GuidedStep;
  id: string;
  number: string;
  label: string;
  shortLabel: string;
}> = [
  { step: 1, id: "flowers", number: "1", label: "Flowers", shortLabel: "Flowers" },
  { step: 2, id: "style", number: "2", label: "Style", shortLabel: "Style" },
  { step: 3, id: "personalize", number: "3", label: "Personalize", shortLabel: "Personalize" },
  { step: 4, id: "share", number: "4", label: "Share", shortLabel: "Share" },
];

const FLOWER_FILTER_CHIPS = [
  { id: "all", label: "All Blooms (47)" },
  { id: "roses", label: "Roses" },
  { id: "peonies", label: "Peonies & Ranunculus" },
  { id: "spring", label: "Spring & Summer" },
  { id: "foliage", label: "Greenery & Foliage" },
  { id: "fillers", label: "Fillers & Sprigs" },
] as const;

export function GuidedStudioExperience({
  onSwitchToAdvanced,
  onOpenProjects,
  onOpenAi,
}: {
  onSwitchToAdvanced?: () => void;
  onOpenProjects?: () => void;
  onOpenAi?: () => void;
}) {
  const {
    scene,
    draftSavedAt,
    addStem,
    removeStems,
    applyCompositionPreset,
    setVessel,
    setBowStyle,
    setRibbonFinish,
    setRibbonColor,
    setTableSurface,
    updateCard,
    addPhotoAttachment,
    removePhotoAttachment,
    setVoiceMessage,
    publishShareLink,
    shareState,
    isPublishing,
    publishError,
  } = useStudioScene();

  const [activeStep, setActiveStep] = useState<GuidedStep>(1);
  const [isTrayOpen, setIsTrayOpen] = useState(true);
  const [styleSubTab, setStyleSubTab] = useState<"shapes" | "wrapping" | "ribbon" | "background">("shapes");
  const [flowerSearch, setFlowerSearch] = useState("");
  const [flowerFilter, setFlowerFilter] = useState<string>("all");

  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [projectsModalOpen, setProjectsModalOpen] = useState(false);

  const [copiedLink, setCopiedLink] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<"png" | "jpg" | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Group stem quantities in the current bouquet
  const stemCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of scene.stems) {
      map.set(s.skuId, (map.get(s.skuId) ?? 0) + 1);
    }
    return map;
  }, [scene.stems]);

  // Filtered flowers list
  const filteredFlowers = useMemo(() => {
    return CATALOG_ENTRIES.filter((entry) => {
      if (flowerSearch.trim().length > 0) {
        const q = flowerSearch.toLowerCase();
        const matchesName = entry.name.toLowerCase().includes(q);
        const matchesColor = entry.colorFamily.toLowerCase().includes(q);
        const matchesType = entry.botanicalType ? entry.botanicalType.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesColor && !matchesType) return false;
      }

      if (flowerFilter === "all") return true;
      if (flowerFilter === "roses") {
        return entry.skuId.includes("rose");
      }
      if (flowerFilter === "peonies") {
        return entry.skuId.includes("peony") || entry.skuId.includes("ranunculus");
      }
      if (flowerFilter === "spring") {
        return (
          entry.skuId.includes("tulip") ||
          entry.skuId.includes("anemone") ||
          entry.skuId.includes("camellia") ||
          entry.skuId.includes("carnation") ||
          entry.skuId.includes("dahlia") ||
          entry.skuId.includes("orchid") ||
          entry.skuId.includes("lily") ||
          entry.skuId.includes("sunflower") ||
          entry.skuId.includes("zinnia") ||
          entry.skuId.includes("lotus") ||
          entry.skuId.includes("magnolia")
        );
      }
      if (flowerFilter === "foliage") {
        return entry.role === "foliage";
      }
      if (flowerFilter === "fillers") {
        return entry.role === "filler" || entry.role === "petal";
      }
      return true;
    });
  }, [flowerFilter, flowerSearch]);

  const handleStepClick = (step: GuidedStep) => {
    setActiveStep(step);
    setIsTrayOpen(true);
  };

  const handleDownloadExport = async (mime: "image/png" | "image/jpeg") => {
    const fmt = mime === "image/png" ? "png" : "jpg";
    setExportingFormat(fmt);
    setExportNotice(null);
    try {
      const res = await exportBouquetBlob(scene, CATALOG_META_MAP, {
        aspect: "square",
        mimeType: mime,
        includeCardNote: false,
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
      setExportNotice(`Downloaded high-res ${res.filename}`);
      trackPrivacySafeEvent(fmt === "png" ? "export_png" : "export_jpg");
    } catch {
      setExportNotice("Export failed. Please try again.");
    } finally {
      setExportingFormat(null);
    }
  };

  const handleCopyShareLink = async () => {
    let finalUrl = "";
    if (shareState?.shareUrl) {
      finalUrl = `${window.location.origin}${shareState.shareUrl}`;
    } else {
      const published = await publishShareLink();
      if (published?.shareUrl) {
        finalUrl = `${window.location.origin}${published.shareUrl}`;
      }
    }

    if (finalUrl) {
      try {
        await navigator.clipboard.writeText(finalUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      } catch {
        // clipboard fallback
      }
    }
  };

  const fullShareUrl =
    typeof window !== "undefined" && shareState?.shareUrl
      ? `${window.location.origin}${shareState.shareUrl}`
      : "";
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `I arranged a digital bouquet for you on Petal & Prose: ${fullShareUrl}`,
  )}`;

  return (
    <div
      data-testid="guided-studio-root"
      className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)]"
    >
      {/* =========================================================================
          TOP BAR: Clean Desktop & Mobile Header
          Logo • Save Status • My Bouquets • Preview • Share
         ========================================================================= */}
      <header className="flex min-h-[56px] shrink-0 items-center justify-between gap-3 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 sm:px-5 md:px-7">
        {/* Left: Brand Logo & Status */}
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="truncate font-display text-lg font-semibold tracking-tight text-[var(--text-primary)] hover:text-[var(--accent-primary)] md:text-xl"
          >
            Petal &amp; Prose
          </Link>

          {/* Stem count indicator */}
          <span
            data-testid="stem-counter"
            className="inline-flex items-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-well)]/70 px-2.5 py-0.5 text-xs font-medium text-[var(--text-secondary)]"
          >
            {scene.stems.length} / 18 stems
          </span>

          {/* Save Status Indicator */}
          <div className="hidden items-center gap-1.5 text-xs text-[var(--text-muted)] sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-success-ink)]" />
            <span>Saved</span>
          </div>
        </div>

        {/* Right: Actions (My Bouquets, Preview, Share, Advanced Studio) */}
        <div className="flex shrink-0 items-center gap-2">
          {/* My Bouquets Button */}
          <button
            type="button"
            data-testid="open-projects-btn"
            onClick={() => {
              if (onOpenProjects) onOpenProjects();
              else setProjectsModalOpen(true);
            }}
            className="inline-flex min-h-[34px] items-center rounded-full border border-[var(--border-hairline)] bg-white px-3 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
          >
            <span className="sm:hidden">Drafts</span>
            <span className="hidden sm:inline">My Bouquets</span>
          </button>

          {/* Preview Button */}
          <button
            type="button"
            data-testid="preview-unboxing-btn"
            onClick={() => setPreviewModalOpen(true)}
            className="inline-flex min-h-[34px] items-center rounded-full border border-[var(--border-hairline)] bg-white px-3 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-primary)]"
          >
            Preview
          </button>

          {/* Share Button (Direct CTA) */}
          <button
            type="button"
            data-testid="jump-share-btn"
            onClick={() => handleStepClick(4)}
            className="inline-flex min-h-[34px] items-center rounded-full bg-[var(--accent-primary)] px-3.5 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)] shadow-xs"
          >
            Share
          </button>

          {/* Advanced Studio Toggle (For Power Users) */}
          {onSwitchToAdvanced && (
            <button
              type="button"
              data-testid="mode-studio-btn"
              onClick={onSwitchToAdvanced}
              title="Open full Advanced Studio tools"
              className="hidden lg:inline-flex min-h-[32px] items-center rounded-full border border-dashed border-[var(--border-hairline)] px-2.5 text-[11px] font-medium text-[var(--text-muted)] hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Advanced Studio
            </button>
          )}
        </div>
      </header>

      {/* =========================================================================
          MAIN WORKSPACE: The Bouquet Preview is Visually Dominant
         ========================================================================= */}
      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Full Interactive Canvas Viewport */}
        <div className="relative flex h-full w-full flex-1 items-center justify-center">
          <StudioCanvasViewport />
        </div>

        {/* Tray Toggle / Minimize Button */}
        <div className="absolute right-4 bottom-3 z-30 hidden sm:block">
          <button
            type="button"
            onClick={() => setIsTrayOpen((prev) => !prev)}
            aria-expanded={isTrayOpen}
            className="flex items-center gap-1.5 rounded-full border border-[var(--border-hairline)] bg-white/95 px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] shadow-sm backdrop-blur-xs transition hover:text-[var(--text-primary)]"
          >
            <span>{isTrayOpen ? "Minimize Panel" : "Expand Panel"}</span>
            <span className="text-[10px]">{isTrayOpen ? "▼" : "▲"}</span>
          </button>
        </div>
      </main>

      {/* =========================================================================
          COLLAPSIBLE STEP TRAY (Drawer)
         ========================================================================= */}
      {isTrayOpen && (
        <section
          data-testid="guided-step-tray"
          aria-label={`Step ${activeStep} drawer`}
          className="relative z-30 flex max-h-[46vh] min-h-[200px] sm:max-h-[340px] md:max-h-[380px] shrink-0 flex-col border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-lg backdrop-blur-md transition-all duration-200"
        >
          {/* Tray Header & Close Button (Mobile Drag Indicator) */}
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-hairline)]/80 px-4 py-2 sm:px-6">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-primary)] text-[11px] font-bold text-white">
                {activeStep}
              </span>
              <h2 className="text-xs font-semibold tracking-wider text-[var(--text-primary)] uppercase">
                {activeStep === 1 && "Select Flowers & Greenery"}
                {activeStep === 2 && "Arrangement Style & Wrapping"}
                {activeStep === 3 && "Personalize Your Card"}
                {activeStep === 4 && "Share & Download Bouquet"}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTrayOpen(false)}
                aria-label="Close drawer"
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--bg-well)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>
          </div>

          {/* STEP 1: FLOWER SELECTION */}
          {activeStep === 1 && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
              {/* Search & Filter Bar */}
              <div className="mb-3 flex shrink-0 flex-wrap items-center gap-2">
                <div className="relative min-w-[160px] flex-1 sm:max-w-xs">
                  <input
                    type="search"
                    data-testid="library-search-input"
                    placeholder="Search 47 flowers & greens…"
                    value={flowerSearch}
                    onChange={(e) => setFlowerSearch(e.target.value)}
                    className="w-full rounded-full border border-[var(--border-hairline)] bg-white px-3.5 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-hidden"
                  />
                  {flowerSearch && (
                    <button
                      type="button"
                      onClick={() => setFlowerSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-muted)]"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {FLOWER_FILTER_CHIPS.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setFlowerFilter(chip.id)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                        flowerFilter === chip.id
                          ? "bg-[var(--accent-primary)] text-white shadow-2xs"
                          : "border border-[var(--border-hairline)] bg-white text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clean Flower Cards Grid */}
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                  {filteredFlowers.map((flower) => {
                    const countInBouquet = stemCounts.get(flower.skuId) ?? 0;
                    return (
                      <div
                        key={flower.skuId}
                        data-testid={`flower-card-${flower.skuId}`}
                        className="group relative flex flex-col items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-white p-2.5 text-center transition hover:border-[var(--accent-primary)] hover:shadow-xs"
                      >
                        {/* Bouquet Quantity Badge */}
                        {countInBouquet > 0 && (
                          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--accent-primary)] px-1 text-[9px] font-bold text-white">
                            {countInBouquet}
                          </span>
                        )}

                        {/* Thumbnail */}
                        <div className="relative mb-1.5 flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={flower.thumbPath}
                            alt={flower.name}
                            loading="lazy"
                            className="h-full w-full object-contain drop-shadow-2xs transition-transform duration-200 group-hover:scale-105"
                          />
                        </div>

                        {/* Name & Color */}
                        <div className="mb-2 w-full">
                          <h3 className="truncate font-medium text-xs text-[var(--text-primary)]">
                            {flower.name}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                            <span
                              className="h-2 w-2 rounded-full border border-black/10"
                              style={{ backgroundColor: flower.colorHex }}
                            />
                            <span className="capitalize">{flower.colorFamily}</span>
                          </span>
                        </div>

                        {/* Add / Adjust Buttons */}
                        <div className="flex w-full items-center gap-1">
                          <button
                            type="button"
                            data-testid={`add-stem-${flower.skuId}`}
                            onClick={() => {
                              addStem(flower.skuId);
                            }}
                            className="flex min-h-[30px] flex-1 items-center justify-center rounded-lg bg-[var(--accent-primary-soft)] text-xs font-semibold text-[var(--accent-primary)] transition hover:bg-[var(--accent-primary)] hover:text-white"
                          >
                            + Add
                          </button>
                          {countInBouquet > 0 && (
                            <button
                              type="button"
                              data-testid={`remove-stem-${flower.skuId}`}
                              title="Remove one stem"
                              onClick={() => {
                                const lastStem = [...scene.stems].reverse().find((s) => s.skuId === flower.skuId);
                                if (lastStem) removeStems([lastStem.id]);
                              }}
                              className="flex h-[30px] w-7 items-center justify-center rounded-lg border border-[var(--border-hairline)] bg-white text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--status-error-fill)] hover:text-[var(--status-error-ink)]"
                            >
                              −
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: STYLE (Bouquet Shapes, Wrapping, Ribbon, Background) */}
          {activeStep === 2 && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
              {/* Sub-Tabs */}
              <div className="mb-3 flex shrink-0 items-center gap-1.5 border-b border-[var(--border-hairline)]/70 pb-2">
                {(
                  [
                    { id: "shapes", label: "Bouquet Shapes (10)" },
                    { id: "wrapping", label: "Wrapping Paper (7)" },
                    { id: "ribbon", label: "Ribbon & Tie" },
                    { id: "background", label: "Background Surface" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStyleSubTab(tab.id)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      styleSubTab === tab.id
                        ? "bg-[var(--accent-primary)] text-white shadow-2xs"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-well)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sub-tab 1: Bouquet Shapes (10 Presets) */}
              {styleSubTab === "shapes" && (
                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                    {COMPOSITION_PRESET_IDS.map((pid) => {
                      const meta = COMPOSITION_PRESET_LABELS[pid];
                      const active = scene.presentation.compositionPreset === pid;
                      return (
                        <button
                          key={pid}
                          type="button"
                          data-testid={`shape-card-${pid}`}
                          onClick={() => applyCompositionPreset(pid)}
                          className={`flex flex-col items-start justify-between rounded-xl border p-3 text-left transition ${
                            active
                              ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)]/50 ring-2 ring-[var(--accent-primary)]/30"
                              : "border-[var(--border-hairline)] bg-white hover:border-[var(--text-secondary)]"
                          }`}
                        >
                          <span className="font-semibold text-xs text-[var(--text-primary)]">
                            {meta?.label ?? formatSlugLabel(pid)}
                          </span>
                          <span className="mt-1 line-clamp-2 text-[10px] text-[var(--text-secondary)]">
                            {meta?.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Wrapping (7 Papers) */}
              {styleSubTab === "wrapping" && (
                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
                    {VESSEL_IDS.filter((v) => v.startsWith("wrap-")).map((wrapId) => {
                      const active = scene.presentation.vesselId === wrapId;
                      return (
                        <button
                          key={wrapId}
                          type="button"
                          data-testid={`wrap-card-${wrapId}`}
                          onClick={() => setVessel(wrapId)}
                          className={`flex flex-col items-center rounded-xl border p-3 text-center transition ${
                            active
                              ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)]/40 ring-2 ring-[var(--accent-primary)]/30"
                              : "border-[var(--border-hairline)] bg-white hover:border-[var(--text-secondary)]"
                          }`}
                        >
                          <span className="h-8 w-8 rounded-full border border-black/10 shadow-inner bg-gradient-to-br from-amber-50 to-stone-200" />
                          <span className="mt-2 text-xs font-medium text-[var(--text-primary)]">
                            {formatSlugLabel(wrapId.replace("wrap-", ""))}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Ribbon & Bow */}
              {styleSubTab === "ribbon" && (
                <div className="min-h-0 flex-1 overflow-y-auto space-y-4 pr-1">
                  {/* Bow Styles */}
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Tie &amp; Bow Placement
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {BOW_STYLE_IDS.map((styleId) => {
                        const active = scene.presentation.bowStyleId === styleId;
                        return (
                          <button
                            key={styleId}
                            type="button"
                            onClick={() => setBowStyle(styleId)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                              active
                                ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                                : "border-[var(--border-hairline)] bg-white hover:border-[var(--text-primary)]"
                            }`}
                          >
                            {BOW_LABELS[styleId]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ribbon Finishes */}
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Ribbon Fabric
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {RIBBON_FINISH_IDS.map((finishId) => {
                        const active = scene.presentation.ribbonFinishId === finishId;
                        return (
                          <button
                            key={finishId}
                            type="button"
                            onClick={() => setRibbonFinish(finishId)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                              active
                                ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                                : "border-[var(--border-hairline)] bg-white hover:border-[var(--text-primary)]"
                            }`}
                          >
                            {RIBBON_FINISH_LABELS[finishId]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ribbon Colors */}
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Ribbon Color
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {RIBBON_COLOR_IDS.map((colorId) => {
                        const swatch = RIBBON_SWATCHES[colorId];
                        const active = scene.presentation.ribbonColorId === colorId;
                        return (
                          <button
                            key={colorId}
                            type="button"
                            onClick={() => setRibbonColor(colorId)}
                            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                              active
                                ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)]"
                                : "border-[var(--border-hairline)] bg-white hover:border-[var(--text-primary)]"
                            }`}
                          >
                            <span
                              className="h-3 w-3 rounded-full border border-black/15"
                              style={{ backgroundColor: swatch.hex }}
                            />
                            <span>{swatch.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 4: Background Table */}
              {styleSubTab === "background" && (
                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {TABLE_SURFACE_IDS.map((surfaceId) => {
                      const active = scene.presentation.tableSurfaceId === surfaceId;
                      return (
                        <button
                          key={surfaceId}
                          type="button"
                          onClick={() => setTableSurface(surfaceId)}
                          className={`flex flex-col items-center rounded-xl border p-4 text-center transition ${
                            active
                              ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)]/40 ring-2 ring-[var(--accent-primary)]/30"
                              : "border-[var(--border-hairline)] bg-white hover:border-[var(--text-secondary)]"
                          }`}
                        >
                          <span className="font-semibold text-xs text-[var(--text-primary)]">
                            {formatSlugLabel(surfaceId)}
                          </span>
                          <span className="mt-1 text-[10px] text-[var(--text-muted)]">
                            {surfaceId === "linen" && "Warm botanical cloth"}
                            {surfaceId === "limewash" && "Mineral chalk wall"}
                            {surfaceId === "travertine" && "Warm honed stone"}
                            {surfaceId === "slate" && "Midnight charcoal slab"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: PERSONALIZE (Card, Message, Photo, Voice) */}
          {activeStep === 3 && (
            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Left: Recipient, Sender & Personal Note */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                        To (Recipient)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Clara"
                        value={scene.card.recipientName}
                        onChange={(e) => updateCard({ recipientName: e.target.value })}
                        className="w-full rounded-lg border border-[var(--border-hairline)] bg-white px-3 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                        From (Sender)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Liam"
                        value={scene.card.senderName}
                        onChange={(e) => updateCard({ senderName: e.target.value })}
                        className="w-full rounded-lg border border-[var(--border-hairline)] bg-white px-3 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs font-semibold text-[var(--text-secondary)]">
                        Personal Note
                      </label>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {scene.card.message.length}/500 chars
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={500}
                      placeholder="Write your personal message…"
                      value={scene.card.message}
                      onChange={(e) => updateCard({ message: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border-hairline)] bg-white p-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-hidden"
                    />

                    {/* Quick Inspiration Chips */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {CARD_MESSAGE_STARTERS.slice(0, 4).map((starter, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => updateCard({ message: starter.text })}
                          className="rounded-full border border-[var(--border-hairline)] bg-white px-2.5 py-0.5 text-[10px] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)]"
                        >
                          + {starter.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Card Templates, Optional Photo, Optional Voice */}
                <div className="space-y-4">
                  {/* Card Templates */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                      Card Paper Template
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {CARD_TEMPLATE_IDS.map((tid) => {
                        const meta = CARD_TEMPLATE_META[tid];
                        const active = scene.card.templateId === tid;
                        return (
                          <button
                            key={tid}
                            type="button"
                            onClick={() => updateCard({ templateId: tid, envelopeId: tid })}
                            className={`rounded-lg border p-2 text-center transition ${
                              active
                                ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] ring-1 ring-[var(--accent-primary)]"
                                : "border-[var(--border-hairline)] bg-white hover:border-[var(--text-secondary)]"
                            }`}
                          >
                            <span className="block truncate text-xs font-semibold text-[var(--text-primary)]">
                              {meta?.label ?? formatSlugLabel(tid)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Optional Keepsakes (Photo & Voice) */}
                  <div className="rounded-xl border border-[var(--border-hairline)] bg-white/70 p-3">
                    <span className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">
                      Optional Keepsake Attachments
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {/* Photo Button */}
                      <button
                        type="button"
                        onClick={() => setPhotoModalOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                      >
                        <span>📷</span>
                        <span>
                          {scene.photos && scene.photos.length > 0
                            ? `Photo Attached (${scene.photos.length})`
                            : "+ Add Photo"}
                        </span>
                      </button>

                      {/* Voice Message Button */}
                      <button
                        type="button"
                        onClick={() => setVoiceModalOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                      >
                        <span>🎙️</span>
                        <span>{scene.voiceMessage ? "Voice Attached" : "+ Record Voice"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SHARE (Final Bouquet, Final Card, Copy Link, WhatsApp, Download PNG/JPG) */}
          {activeStep === 4 && (
            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
              <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
                {/* Final Card & Bouquet Summary */}
                <div className="rounded-xl border border-[var(--border-hairline)] bg-white p-4">
                  <h3 className="mb-2 font-display text-sm font-semibold text-[var(--text-primary)]">
                    Bouquet Presentation
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-well)]/40 p-1">
                      <BouquetCanvasDisplay scene={scene} width={80} height={80} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-xs text-[var(--text-primary)]">
                        {scene.card.recipientName ? `For ${scene.card.recipientName}` : "Custom Bouquet"}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        {scene.stems.length} botanical stems •{" "}
                        {COMPOSITION_PRESET_LABELS[scene.presentation.compositionPreset]?.label}
                      </p>
                      {scene.card.message && (
                        <p className="mt-1 line-clamp-2 italic text-[11px] text-[var(--text-muted)]">
                          “{scene.card.message}”
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Actions: Copy Link, WhatsApp, PNG, JPG */}
                <div className="space-y-3">
                  {/* Shareable Link Box */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      data-testid="copy-link-btn"
                      onClick={handleCopyShareLink}
                      disabled={isPublishing}
                      className="flex-1 rounded-xl bg-[var(--text-primary)] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary)] disabled:opacity-50"
                    >
                      {isPublishing
                        ? "Creating link…"
                        : copiedLink
                          ? "✓ Link Copied to Clipboard!"
                          : "🔗 Copy Shareable Link"}
                    </button>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center rounded-xl border border-emerald-600 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-600 hover:text-white"
                      title="Share to WhatsApp"
                    >
                      WhatsApp
                    </a>
                  </div>

                  {/* Download PNG & JPG */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      data-testid="download-png-btn"
                      disabled={exportingFormat !== null}
                      onClick={() => handleDownloadExport("image/png")}
                      className="flex-1 rounded-xl border border-[var(--border-hairline)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] disabled:opacity-50"
                    >
                      {exportingFormat === "png" ? "Rendering PNG…" : "Download PNG (2048px)"}
                    </button>

                    <button
                      type="button"
                      data-testid="download-jpg-btn"
                      disabled={exportingFormat !== null}
                      onClick={() => handleDownloadExport("image/jpeg")}
                      className="flex-1 rounded-xl border border-[var(--border-hairline)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] disabled:opacity-50"
                    >
                      {exportingFormat === "jpg" ? "Rendering JPG…" : "Download JPG (Linen)"}
                    </button>
                  </div>

                  {exportNotice && (
                    <p className="text-[11px] text-[var(--status-success-ink)]">{exportNotice}</p>
                  )}
                  {publishError && (
                    <p className="text-[11px] text-[var(--status-error-ink)]">{publishError}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          BOTTOM DOCKED FOUR-STEP NAVIGATION (Fixed at bottom on desktop & mobile)
          1. Flowers • 2. Style • 3. Personalize • 4. Share
         ========================================================================= */}
      <nav
        aria-label="Four-step bouquet creation navigation"
        className="z-40 flex min-h-[58px] shrink-0 items-center justify-around border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-1.5 shadow-md md:px-6"
      >
        <div className="grid w-full max-w-2xl grid-cols-4 gap-1.5 sm:gap-3">
          {GUIDED_STEPS.map((item) => {
            const isCurrent = activeStep === item.step;
            const isCompleted = activeStep > item.step;
            return (
              <button
                key={item.step}
                type="button"
                data-testid={`guided-nav-${item.id}`}
                aria-current={isCurrent ? "step" : undefined}
                onClick={() => handleStepClick(item.step)}
                className={`flex min-h-[44px] flex-col items-center justify-center rounded-xl px-1 py-1 text-center transition sm:flex-row sm:gap-2 ${
                  isCurrent
                    ? "bg-[var(--accent-primary)] text-white shadow-xs"
                    : isCompleted
                      ? "bg-[var(--accent-primary-soft)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20"
                      : "bg-[var(--bg-well)]/60 text-[var(--text-secondary)] hover:bg-[var(--bg-well)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                    isCurrent
                      ? "bg-white text-[var(--accent-primary)]"
                      : isCompleted
                        ? "bg-[var(--accent-primary)] text-white"
                        : "bg-black/10 text-[var(--text-secondary)]"
                  }`}
                >
                  {isCompleted ? "✓" : item.number}
                </span>
                <span className="text-[11px] font-semibold sm:text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* =========================================================================
          ATTACHMENT MODALS (Photo Cropper, Voice Recorder, Saved Projects, Preview)
         ========================================================================= */}
      {photoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Attach Photo"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs"
        >
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[var(--bg-surface)] p-4 shadow-2xl">
            <div className="mb-2 flex items-center justify-between border-b border-[var(--border-hairline)] pb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                Attach Keepsake Photo
              </h3>
              <button
                type="button"
                onClick={() => setPhotoModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--bg-well)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <PhotoCropperAttachment />
            </div>
          </div>
        </div>
      )}

      {voiceModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Voice Message"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs"
        >
          <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-[var(--bg-surface)] p-4 shadow-2xl">
            <div className="mb-2 flex items-center justify-between border-b border-[var(--border-hairline)] pb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                Record Voice Message
              </h3>
              <button
                type="button"
                onClick={() => setVoiceModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--bg-well)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <VoiceMessageRecorder />
            </div>
          </div>
        </div>
      )}

      <SavedProjectsDrawer
        open={projectsModalOpen}
        onClose={() => setProjectsModalOpen(false)}
      />

      {/* Interactive Unboxing Reveal Modal */}
      {previewModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Bouquet preview"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs"
        >
          <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-[var(--bg-surface)] p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between border-b border-[var(--border-hairline)] pb-2">
              <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">
                Recipient Unboxing Preview
              </h3>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--bg-well)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>
            <div className="flex min-h-[300px] flex-1 items-center justify-center overflow-hidden rounded-xl bg-[var(--bg-canvas)] p-2">
              <BouquetCanvasDisplay scene={scene} width={440} height={440} />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)]">
                {scene.card.recipientName ? `Dedicated to ${scene.card.recipientName}` : "Digital Bouquet"}
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="rounded-full bg-[var(--text-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--accent-primary)]"
              >
                Back to Studio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
