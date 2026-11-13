"use client";

import React, { useMemo, useState } from "react";
import { CORE_ELEVEN_OCCASIONS, OCCASION_TEMPLATES } from "@/engine/occasions";
import { COMPOSITION_PRESET_LABELS } from "@/engine/presets";
import { TABLE_SURFACE_THEMES } from "@/engine/canvas-renderer";
import {
  BOW_STYLE_IDS,
  BotanicalRole,
  CARD_TEMPLATE_IDS,
  CARD_TEXT_COLOR_IDS,
  CARD_TEXT_COLOR_STYLES,
  COMPOSITION_PRESET_IDS,
  FONT_PAIRING_IDS,
  MAX_STEMS_GLOBAL,
  PAPER_TINT_IDS,
  PAPER_TINT_STYLES,
  RIBBON_COLOR_IDS,
  RIBBON_FINISH_IDS,
  TABLE_SURFACE_IDS,
  VESSEL_IDS,
  VESSEL_RULES,
  WAX_SEAL_COLOR_IDS,
} from "@/engine/types";
import { CATALOG_ENTRIES, CATALOG_META_MAP } from "@/generated/catalog-manifest";
import { CARD_MESSAGE_STARTERS, CARD_TEMPLATE_META } from "@/lib/card-styles";
import {
  BOW_LABELS,
  RIBBON_FINISH_LABELS,
  RIBBON_SWATCHES,
  WAX_SWATCHES,
  formatSlugLabel,
} from "@/lib/studio-labels";
import { BouquetCanvasDisplay } from "@/components/unboxing/BouquetCanvasDisplay";
import { FinalSharePreviewStage } from "./FinalSharePreviewStage";
import { PhotoCropperAttachment } from "./PhotoCropperAttachment";
import { ShareAndExportControls } from "./ShareAndExportControls";
import { useStudioScene } from "./StudioSceneProvider";
import { VoiceMessageRecorder } from "./VoiceMessageRecorder";

export type QuickCreateStep = 1 | 2 | 3 | 4 | 5;

const QUICK_STEPS: ReadonlyArray<{
  step: QuickCreateStep;
  mobileLabel: string;
  label: string;
}> = [
  { step: 1, mobileLabel: "Occasion", label: "1. Occasion" },
  { step: 2, mobileLabel: "Style", label: "2. Style" },
  { step: 3, mobileLabel: "Flowers", label: "3. Flowers" },
  { step: 4, mobileLabel: "Card", label: "4. Card" },
  { step: 5, mobileLabel: "Share", label: "5. Share" },
];

type BloomFilter = "all" | "focal" | "filler" | "foliage";

const FILTER_TABS: ReadonlyArray<{ id: BloomFilter; label: string }> = [
  { id: "all", label: "All Stems" },
  { id: "focal", label: "Focal Blooms" },
  { id: "filler", label: "Fillers & Accents" },
  { id: "foliage", label: "Greenery" },
];

const WRAP_VESSELS = VESSEL_IDS.filter((v) => VESSEL_RULES[v].category === "wrap");
const VASE_AND_MINIMAL_VESSELS = VESSEL_IDS.filter((v) => VESSEL_RULES[v].category !== "wrap");

function countStemsByRole(roles: readonly BotanicalRole[], target: BloomFilter): boolean {
  if (target === "all") return true;
  if (target === "filler") return roles.includes("filler") || roles.includes("petal");
  return roles.includes(target);
}

/**
 * Mode A: Guided 5-step Quick Create workspace for effortless florist-grade bouquets.
 */
export function QuickCreateFlow({
  onSwitchToStudio,
  onOpenAi,
}: {
  onSwitchToStudio: () => void;
  onOpenAi: () => void;
}) {
  const {
    scene,
    applyOccasionTemplate,
    applyCompositionPreset,
    setVessel,
    setBowStyle,
    setRibbonFinish,
    setRibbonColor,
    setTableSurface,
    addStem,
    removeOneBySku,
    resetArrangement,
    updateCard,
    setShowColophon,
    setHideNamesInPreview,
  } = useStudioScene();

  const [step, setStep] = useState<QuickCreateStep>(1);
  const [vesselGroup, setVesselGroup] = useState<"wrap" | "vase">(
    VESSEL_RULES[scene.presentation.vesselId].category === "wrap" ? "wrap" : "vase",
  );
  const [bloomFilter, setBloomFilter] = useState<BloomFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobilePreviewExpanded, setMobilePreviewExpanded] = useState(false);

  const vesselRule = VESSEL_RULES[scene.presentation.vesselId];
  const currentOccasion = scene.occasionTag ? OCCASION_TEMPLATES[scene.occasionTag] : undefined;
  const presetMeta =
    COMPOSITION_PRESET_LABELS[scene.presentation.compositionPreset] ?? COMPOSITION_PRESET_LABELS.round;

  const groupedSelectedStems = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of scene.stems) {
      counts.set(s.skuId, (counts.get(s.skuId) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([skuId, count]) => ({
      skuId,
      count,
      meta: CATALOG_META_MAP.get(skuId),
    }));
  }, [scene.stems]);

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CATALOG_ENTRIES.filter((item) => {
      if (!countStemsByRole([item.role], bloomFilter)) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.familyId.toLowerCase().includes(q) ||
        item.colorAnchor.toLowerCase().includes(q) ||
        item.meaningShort.toLowerCase().includes(q)
      );
    });
  }, [bloomFilter, searchQuery]);

  const hasBlankMessageWarning = !scene.card.isVisualOnly && scene.card.message.trim().length === 0;
  const maxReached = scene.stems.length >= MAX_STEMS_GLOBAL;

  return (
    <div
      data-testid="quick-create-mode"
      className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[var(--bg-canvas)] lg:grid lg:grid-cols-12 lg:overflow-hidden"
    >
      {/* Left Gallery Showcase (Desktop sticky / Step 5 reveal stage) */}
      {step === 5 ? (
        <div className="shrink-0 border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)] lg:col-span-6 lg:border-r lg:border-b-0 xl:col-span-7">
          <div className="h-full min-h-[420px] lg:overflow-y-auto">
            <FinalSharePreviewStage onBackToStep={(s) => setStep(s)} />
          </div>
        </div>
      ) : (
        <section
          aria-label="Live bouquet preview"
          className="shrink-0 border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-3 lg:col-span-6 lg:flex lg:flex-col lg:justify-between lg:overflow-y-auto lg:border-r lg:border-b-0 lg:p-6 xl:col-span-6"
        >
          <div className="mx-auto flex w-full max-w-[540px] flex-col gap-2.5">
            {/* Ambient Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="rounded-full border border-[var(--border-hairline)] bg-white px-2.5 py-1 font-medium text-[var(--text-primary)]">
                  {currentOccasion ? currentOccasion.label : "Custom Arrangement"}
                </span>
                <span className="rounded-full bg-[var(--bg-well)] px-2.5 py-1 text-[var(--text-secondary)]">
                  {presetMeta.label}
                </span>
                <span
                  data-testid="quick-stem-count"
                  className="rounded-full bg-[var(--accent-primary-soft)] px-2.5 py-1 font-semibold text-[var(--accent-primary)]"
                >
                  {scene.stems.length} stems
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMobilePreviewExpanded((p) => !p)}
                className="min-h-[30px] rounded-full border border-[var(--border-hairline)] bg-white px-2.5 text-[11px] font-medium text-[var(--text-secondary)] lg:hidden"
              >
                {mobilePreviewExpanded ? "Compact View" : "Expand Preview"}
              </button>
            </div>

            {/* Museum-Framed Photorealistic Render */}
            <div
              className={`relative mx-auto flex w-full items-center justify-center overflow-hidden rounded-3xl border border-[var(--border-hairline)] bg-white shadow-sm transition-all ${
                mobilePreviewExpanded ? "h-[360px]" : "h-[245px] sm:h-[290px]"
              } lg:h-auto lg:aspect-[5/6] lg:max-h-[calc(100dvh-215px)]`}
            >
              <BouquetCanvasDisplay
                scene={scene}
                width={800}
                height={960}
                includeColophon={scene.showColophon}
                className="h-full w-full object-contain"
              />
            </div>

            {/* Gentle Advanced Studio Escape Hatch */}
            <div className="hidden items-center justify-between rounded-2xl border border-[var(--border-hairline)] bg-white/80 px-4 py-2.5 text-xs text-[var(--text-secondary)] lg:flex">
              <span>Want manual stem drag, angle tilt &amp; depth layering?</span>
              <button
                type="button"
                data-testid="quick-open-studio-btn"
                onClick={onSwitchToStudio}
                className="font-semibold text-[var(--accent-primary)] hover:underline"
              >
                Refine in Advanced Studio →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Right Guided 5-Step Flow Deck */}
      <section
        aria-label="Quick Create guided bouquet steps"
        className={`flex min-h-0 flex-1 flex-col bg-[var(--bg-surface)] ${
          step === 5 ? "lg:col-span-6 xl:col-span-5" : "lg:col-span-6"
        } lg:overflow-hidden`}
      >
        {/* Crisp 5-Step Progress Strip */}
        <nav
          aria-label="Quick Create steps"
          className="shrink-0 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2.5 sm:px-5"
        >
          <div className="grid grid-cols-5 gap-1">
            {QUICK_STEPS.map((item) => {
              const current = step === item.step;
              const completed = step > item.step;
              return (
                <button
                  key={item.step}
                  type="button"
                  data-testid={`quick-step-${item.step}`}
                  aria-current={current ? "step" : undefined}
                  onClick={() => setStep(item.step)}
                  className={`min-h-[36px] rounded-full px-1 text-[11px] font-semibold transition sm:px-2 sm:text-xs ${
                    current
                      ? "bg-[var(--accent-primary)] text-white shadow-2xs"
                      : completed
                        ? "bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]"
                        : "bg-[var(--bg-well)]/80 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  <span className="sm:hidden">{item.mobileLabel}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Step Content Area */}
        <div className="flex-1 space-y-5 p-4 sm:p-6 lg:overflow-y-auto">
          {/* ==================== STEP 1: CHOOSE OCCASION ==================== */}
          {step === 1 && (
            <div className="space-y-4" data-testid="quick-step1-occasion">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h1 className="font-display text-2xl font-medium text-[var(--text-primary)] sm:text-3xl">
                    Who are these blooms for?
                  </h1>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Select an occasion for a florist-curated palette, or ask our AI Florist for a custom concept.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenAi}
                  className="min-h-[36px] shrink-0 rounded-full border border-[var(--accent-primary)]/40 bg-[var(--accent-primary-soft)] px-3 text-xs font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white"
                >
                  Describe Your Idea
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {CORE_ELEVEN_OCCASIONS.map((occ) => {
                  const selected = scene.occasionTag === occ.slug;
                  return (
                    <button
                      key={occ.slug}
                      type="button"
                      data-testid={`quick-occasion-${occ.slug}`}
                      onClick={() => applyOccasionTemplate(occ.slug, "full")}
                      className={`group flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)]/70 ring-1 ring-[var(--accent-primary)]"
                          : "border-[var(--border-hairline)] bg-white hover:border-[var(--border-strong)]"
                      }`}
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <span className="font-display text-xl font-medium text-[var(--text-primary)]">
                          {occ.label}
                        </span>
                        <div className="flex shrink-0 items-center gap-1 pt-1">
                          {occ.paletteSwatches.slice(0, 4).map((hex, i) => (
                            <span
                              key={i}
                              className="h-3 w-3 rounded-full border border-black/15"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                        {occ.tagline}
                      </p>
                      <span className="mt-2.5 text-[11px] font-semibold text-[var(--accent-primary)]">
                        {selected ? "Selected Palette ✓" : `Apply ${occ.paletteLabel} →`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== STEP 2: CHOOSE BOUQUET STYLE ==================== */}
          {step === 2 && (
            <div className="space-y-6" data-testid="quick-step2-style">
              <div>
                <h1 className="font-display text-2xl font-medium text-[var(--text-primary)] sm:text-3xl">
                  Style wrap, silhouette &amp; ribbon
                </h1>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Shape the silhouette and dress your stems in textured linen, paper wraps, or atelier glass vases.
                </p>
              </div>

              {/* Bouquet Shape */}
              <div>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Bouquet Silhouette
                </h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {COMPOSITION_PRESET_IDS.map((pid) => {
                    const meta = COMPOSITION_PRESET_LABELS[pid];
                    const active = scene.presentation.compositionPreset === pid;
                    return (
                      <button
                        key={pid}
                        type="button"
                        data-testid={`quick-preset-${pid}`}
                        onClick={() => applyCompositionPreset(pid)}
                        className={`rounded-xl border p-3 text-left transition ${
                          active
                            ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] ring-1 ring-[var(--accent-primary)]"
                            : "border-[var(--border-hairline)] bg-white hover:border-[var(--border-strong)]"
                        }`}
                      >
                        <p className="text-xs font-semibold text-[var(--text-primary)]">{meta.label}</p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[var(--text-secondary)]">
                          {meta.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Wrapping Paper or Vase */}
              <div>
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Wrapping &amp; Vessels
                  </h2>
                  <div className="inline-flex rounded-full border border-[var(--border-hairline)] bg-white p-0.5">
                    <button
                      type="button"
                      onClick={() => setVesselGroup("wrap")}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                        vesselGroup === "wrap"
                          ? "bg-[var(--text-primary)] text-white"
                          : "text-[var(--text-secondary)]"
                      }`}
                    >
                      Paper &amp; Linen Wraps
                    </button>
                    <button
                      type="button"
                      onClick={() => setVesselGroup("vase")}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                        vesselGroup === "vase"
                          ? "bg-[var(--text-primary)] text-white"
                          : "text-[var(--text-secondary)]"
                      }`}
                    >
                      Vases &amp; Stems
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(vesselGroup === "wrap" ? WRAP_VESSELS : VASE_AND_MINIMAL_VESSELS).map((vid) => {
                    const rule = VESSEL_RULES[vid];
                    const active = scene.presentation.vesselId === vid;
                    return (
                      <button
                        key={vid}
                        type="button"
                        data-testid={`quick-vessel-${vid}`}
                        onClick={() => setVessel(vid)}
                        className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
                          active
                            ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] ring-1 ring-[var(--accent-primary)]"
                            : "border-[var(--border-hairline)] bg-white hover:border-[var(--border-strong)]"
                        }`}
                      >
                        <span
                          className="mb-2 h-6 w-full rounded-md border border-black/10"
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
                        <span className="text-xs font-medium leading-tight text-[var(--text-primary)]">
                          {rule.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ribbon Material, Bow Style & Color */}
              {vesselRule.supportsBow && (
                <div className="space-y-3 rounded-2xl border border-[var(--border-hairline)] bg-white p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <h3 className="mb-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                        Ribbon Texture
                      </h3>
                      <div className="grid grid-cols-2 gap-1.5">
                        {RIBBON_FINISH_IDS.map((rf) => {
                          const active = (scene.presentation.ribbonFinishId ?? "satin") === rf;
                          return (
                            <button
                              key={rf}
                              type="button"
                              onClick={() => setRibbonFinish(rf)}
                              className={`min-h-[34px] rounded-lg border px-2 text-xs font-medium transition ${
                                active
                                  ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] font-semibold text-[var(--accent-primary)]"
                                  : "border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-secondary)]"
                              }`}
                            >
                              {RIBBON_FINISH_LABELS[rf]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-1.5 text-xs font-semibold text-[var(--text-secondary)]">Bow Style</h3>
                      <div className="grid grid-cols-2 gap-1.5">
                        {BOW_STYLE_IDS.map((bid) => {
                          const active = scene.presentation.bowStyleId === bid;
                          return (
                            <button
                              key={bid}
                              type="button"
                              onClick={() => setBowStyle(bid)}
                              className={`min-h-[34px] rounded-lg border px-2 text-xs font-medium transition ${
                                active
                                  ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] font-semibold text-[var(--accent-primary)]"
                                  : "border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-secondary)]"
                              }`}
                            >
                              {BOW_LABELS[bid]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {scene.presentation.bowStyleId !== "none" && (
                    <div>
                      <h3 className="mb-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                        Ribbon Shade
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {RIBBON_COLOR_IDS.map((rc) => {
                          const meta = RIBBON_SWATCHES[rc];
                          const active = scene.presentation.ribbonColorId === rc;
                          return (
                            <button
                              key={rc}
                              type="button"
                              onClick={() => setRibbonColor(rc)}
                              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium ${
                                active
                                  ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] text-[var(--text-primary)]"
                                  : "border-[var(--border-hairline)] bg-white text-[var(--text-secondary)]"
                              }`}
                            >
                              <span
                                className="h-3.5 w-3.5 rounded-full border border-black/20"
                                style={{ backgroundColor: meta.hex }}
                              />
                              <span>{meta.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Table Backdrop Surface */}
              <div>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Studio Backdrop Surface
                </h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {TABLE_SURFACE_IDS.map((sid) => {
                    const t = TABLE_SURFACE_THEMES[sid];
                    const active = scene.presentation.tableSurfaceId === sid;
                    return (
                      <button
                        key={sid}
                        type="button"
                        data-testid={`quick-surface-${sid}`}
                        onClick={() => setTableSurface(sid)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-medium transition ${
                          active
                            ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] ring-1 ring-[var(--accent-primary)]"
                            : "border-[var(--border-hairline)] bg-white hover:border-[var(--border-strong)]"
                        }`}
                      >
                        <span
                          className="h-4 w-4 shrink-0 rounded-full border border-black/15"
                          style={{ background: t.bgTop }}
                        />
                        <span className="truncate">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ==================== STEP 3: CUSTOMIZE FLOWERS ==================== */}
          {step === 3 && (
            <div className="space-y-5" data-testid="quick-step3-flowers">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h1 className="font-display text-2xl font-medium text-[var(--text-primary)] sm:text-3xl">
                    Customize your blooms
                  </h1>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Add or remove stems below—our studio auto-arranges every bloom naturally ({scene.stems.length}/
                    {MAX_STEMS_GLOBAL}).
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    data-testid="quick-shuffle-btn"
                    onClick={resetArrangement}
                    className="min-h-[36px] rounded-full border border-[var(--border-hairline)] bg-white px-3 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                  >
                    Refresh Arrangement
                  </button>
                  <button
                    type="button"
                    onClick={onSwitchToStudio}
                    className="min-h-[36px] rounded-full border border-[var(--accent-primary)]/40 bg-[var(--accent-primary-soft)] px-3 text-xs font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white lg:hidden"
                  >
                    Advanced Studio →
                  </button>
                </div>
              </div>

              {/* Current Stems Summary Strip */}
              <div className="rounded-2xl border border-[var(--border-hairline)] bg-white p-3.5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  In Your Bouquet ({scene.stems.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {groupedSelectedStems.map(({ skuId, count, meta }) => (
                    <div
                      key={skuId}
                      className="flex items-center gap-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas)] py-1 pr-1.5 pl-2 text-xs"
                    >
                      {meta && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={meta.thumbPath} alt="" className="h-5 w-5 rounded-full object-contain" />
                      )}
                      <span className="font-medium text-[var(--text-primary)]">
                        {meta?.name ?? skuId}
                      </span>
                      <span className="text-[var(--text-muted)]">×{count}</span>
                      <button
                        type="button"
                        aria-label={`Remove one ${meta?.name ?? skuId}`}
                        data-testid={`quick-tray-remove-${skuId}`}
                        onClick={() => removeOneBySku(skuId)}
                        className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--status-error-fill)] hover:text-[var(--status-error-ink)]"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        disabled={maxReached}
                        aria-label={`Add one more ${meta?.name ?? skuId}`}
                        onClick={() => addStem(skuId)}
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-primary)] text-xs font-bold text-white disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Filter Tabs & Search */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {FILTER_TABS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setBloomFilter(t.id)}
                        className={`min-h-[34px] rounded-full px-3 text-xs font-semibold transition ${
                          bloomFilter === t.id
                            ? "bg-[var(--text-primary)] text-white"
                            : "border border-[var(--border-hairline)] bg-white text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search roses, peonies, eucalyptus…"
                    aria-label="Filter stems by name"
                    className="min-h-[36px] w-full rounded-xl border border-[var(--border-hairline)] bg-white px-3 text-xs text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none sm:w-56"
                  />
                </div>

                {/* Photographic Specimen Cards */}
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {filteredCatalog.map((item) => {
                    const countInBouquet =
                      groupedSelectedStems.find((g) => g.skuId === item.skuId)?.count ?? 0;
                    return (
                      <div
                        key={item.skuId}
                        className={`flex flex-col justify-between rounded-2xl border p-2.5 transition ${
                          countInBouquet > 0
                            ? "border-[var(--accent-primary)]/60 bg-white ring-1 ring-[var(--accent-primary)]/20"
                            : "border-[var(--border-hairline)] bg-white hover:border-[var(--border-strong)]"
                        }`}
                      >
                        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[var(--bg-canvas)] p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.thumbPath}
                            alt={item.name}
                            loading="lazy"
                            className="h-full w-full object-contain"
                          />
                          {countInBouquet > 0 && (
                            <span className="absolute top-1.5 right-1.5 rounded-full bg-[var(--accent-primary)] px-2 py-0.5 text-[10px] font-semibold text-white">
                              ×{countInBouquet}
                            </span>
                          )}
                        </div>
                        <div className="mt-2">
                          <p className="line-clamp-1 text-xs font-semibold text-[var(--text-primary)]">
                            {item.name}
                          </p>
                          <p className="line-clamp-1 text-[11px] text-[var(--text-muted)]">
                            {item.meaningShort}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={maxReached}
                            data-testid={`quick-add-stem-${item.skuId}`}
                            onClick={() => addStem(item.skuId)}
                            className="min-h-[34px] flex-1 rounded-lg bg-[var(--accent-primary)] px-2 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)] disabled:opacity-45"
                          >
                            + Add
                          </button>
                          {countInBouquet > 0 && (
                            <button
                              type="button"
                              data-testid={`quick-remove-stem-${item.skuId}`}
                              onClick={() => removeOneBySku(item.skuId)}
                              className="min-h-[34px] rounded-lg border border-[var(--border-hairline)] px-2.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-well)]"
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

          {/* ==================== STEP 4: PERSONALIZE CARD ==================== */}
          {step === 4 && (
            <div className="space-y-5" data-testid="quick-step4-card">
              <div>
                <h1 className="font-display text-2xl font-medium text-[var(--text-primary)] sm:text-3xl">
                  Write your personal card
                </h1>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Add a heartfelt note, pick card stationery, or include keepsake photos and a voice greeting.
                </p>
              </div>

              <div className="space-y-3 rounded-2xl border border-[var(--border-hairline)] bg-white p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">
                    To (Recipient)
                    <input
                      type="text"
                      maxLength={80}
                      placeholder="e.g. Clara"
                      value={scene.card.recipientName}
                      onChange={(e) => updateCard({ recipientName: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                    />
                  </label>
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">
                    From (Sender)
                    <input
                      type="text"
                      maxLength={80}
                      placeholder="e.g. Theo"
                      value={scene.card.senderName}
                      onChange={(e) => updateCard({ senderName: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                    />
                  </label>
                </div>

                {!scene.card.isVisualOnly && (
                  <>
                    <label className="block text-xs font-medium text-[var(--text-secondary)]">
                      Message ({scene.card.message.length}/400)
                      <textarea
                        rows={4}
                        maxLength={400}
                        placeholder="Write a heartfelt message…"
                        value={scene.card.message}
                        onChange={(e) => updateCard({ message: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2.5 text-sm leading-relaxed text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                      />
                    </label>

                    {hasBlankMessageWarning && (
                      <p className="rounded-xl border border-[var(--status-warning-border)] bg-[var(--status-warning-fill)] px-3 py-2 text-xs text-[var(--status-warning-ink)]">
                        Tip: Add a personal line above—or tap a starter note below before sharing.
                      </p>
                    )}

                    <div>
                      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        One-Tap Note Starters
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {CARD_MESSAGE_STARTERS.map((starter) => (
                          <button
                            key={starter.label}
                            type="button"
                            onClick={() => updateCard({ message: starter.text })}
                            className="rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                          >
                            {starter.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Essential Stationery & Wax Seal */}
              <div className="space-y-3 rounded-2xl border border-[var(--border-hairline)] bg-white p-4">
                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                    Stationery Template
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {CARD_TEMPLATE_IDS.map((tid) => {
                      const active = scene.card.templateId === tid;
                      return (
                        <button
                          key={tid}
                          type="button"
                          onClick={() => updateCard({ templateId: tid, envelopeId: tid })}
                          className={`min-h-[36px] rounded-xl border px-2.5 text-xs font-medium transition ${
                            active
                              ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] font-semibold text-[var(--accent-primary)]"
                              : "border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-secondary)]"
                          }`}
                        >
                          {CARD_TEMPLATE_META[tid].label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                    Envelope Wax Seal
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {WAX_SEAL_COLOR_IDS.map((wid) => {
                      const meta = WAX_SWATCHES[wid];
                      const active = scene.card.waxSealColorId === wid;
                      return (
                        <button
                          key={wid}
                          type="button"
                          onClick={() => updateCard({ waxSealColorId: wid })}
                          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                            active
                              ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] font-semibold"
                              : "border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
                          }`}
                        >
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-black/20"
                            style={{ backgroundColor: meta.hex }}
                          />
                          <span>{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Clean Collapsible Photo/Voice & Fine Paper Options */}
              <details className="rounded-2xl border border-[var(--border-hairline)] bg-white p-4">
                <summary className="cursor-pointer list-none text-xs font-semibold text-[var(--text-primary)]">
                  + Attach Photos, Voice Message, Ink &amp; Paper Options
                </summary>
                <div className="mt-4 space-y-4">
                  <PhotoCropperAttachment />
                  <VoiceMessageRecorder />

                  <div className="space-y-3 border-t border-[var(--border-hairline)] pt-3">
                    <div>
                      <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                        Paper Tint
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {PAPER_TINT_IDS.map((pid) => {
                          const meta = PAPER_TINT_STYLES[pid];
                          const active = scene.card.paperTintId === pid;
                          return (
                            <button
                              key={pid}
                              type="button"
                              onClick={() => updateCard({ paperTintId: pid })}
                              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                                active
                                  ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] font-semibold"
                                  : "border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
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

                    <div>
                      <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                        Ink Shade
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {CARD_TEXT_COLOR_IDS.map((cid) => {
                          const meta = CARD_TEXT_COLOR_STYLES[cid];
                          const active = (scene.card.textColorId ?? "charcoal") === cid;
                          return (
                            <button
                              key={cid}
                              type="button"
                              onClick={() => updateCard({ textColorId: cid })}
                              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                                active
                                  ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] font-semibold"
                                  : "border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
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

                    <label className="block text-xs font-medium text-[var(--text-secondary)]">
                      Typography Pairing
                      <select
                        value={scene.card.fontPairingId}
                        onChange={(e) =>
                          updateCard({ fontPairingId: e.target.value as (typeof FONT_PAIRING_IDS)[number] })
                        }
                        className="mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2.5 py-2 text-xs text-[var(--text-primary)]"
                      >
                        {FONT_PAIRING_IDS.map((fid) => (
                          <option key={fid} value={fid}>
                            {formatSlugLabel(fid)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="space-y-1.5 text-xs text-[var(--text-primary)]">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={scene.card.isVisualOnly}
                          onChange={(e) => updateCard({ isVisualOnly: e.target.checked })}
                          className="rounded accent-[var(--accent-primary)]"
                        />
                        Bouquet-only keepsake (omit text card)
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={scene.showColophon}
                          onChange={(e) => setShowColophon(e.target.checked)}
                          className="rounded accent-[var(--accent-primary)]"
                        />
                        Include Petal &amp; Prose studio colophon
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={scene.hideNamesInPreview}
                          onChange={(e) => setHideNamesInPreview(e.target.checked)}
                          className="rounded accent-[var(--accent-primary)]"
                        />
                        Hide sender &amp; recipient names in link preview
                      </label>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          )}

          {/* ==================== STEP 5: PREVIEW & SHARE ==================== */}
          {step === 5 && (
            <div className="space-y-4" data-testid="quick-step5-share">
              <div>
                <h1 className="font-display text-2xl font-medium text-[var(--text-primary)] sm:text-3xl">
                  Ready to seal &amp; share
                </h1>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Test your wax-seal envelope reveal on the preview, then create a private link or download a
                  high-resolution print.
                </p>
              </div>
              <ShareAndExportControls
                onEditStems={() => setStep(3)}
                onEditCard={() => setStep(4)}
                onAfterReset={() => setStep(1)}
              />
            </div>
          )}
        </div>

        {/* Clean Step Back / Continue Footer */}
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-3 sm:px-6">
          {step > 1 ? (
            <button
              type="button"
              data-testid="quick-back-btn"
              onClick={() => setStep((step - 1) as QuickCreateStep)}
              className="min-h-[42px] rounded-full border border-[var(--border-hairline)] bg-white px-5 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)]"
            >
              ← Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onSwitchToStudio}
              className="min-h-[42px] rounded-full border border-[var(--border-hairline)] bg-white px-4 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] lg:hidden"
            >
              Advanced Studio →
            </button>
          )}

          {step < 5 && (
            <button
              type="button"
              data-testid="quick-next-btn"
              onClick={() => setStep((step + 1) as QuickCreateStep)}
              className="ml-auto min-h-[44px] rounded-full bg-[var(--accent-primary)] px-6 text-xs font-semibold text-white shadow-xs transition hover:bg-[var(--accent-primary-hover)]"
            >
              Continue to {QUICK_STEPS[step]?.mobileLabel} →
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
