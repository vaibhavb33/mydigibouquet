"use client";

import React, { useMemo, useState } from "react";
import { OCCASION_TEMPLATES } from "@/engine/occasions";
import {
  COMPOSITION_PRESET_LABELS,
  STARTER_BOUQUETS,
  buildSceneFromPreset,
} from "@/engine/presets";
import { TABLE_SURFACE_THEMES, exportBouquetBlob } from "@/engine/canvas-renderer";
import {
  BOW_STYLE_IDS,
  CARD_TEMPLATE_IDS,
  CARD_TEXT_COLOR_STYLES,
  CompositionPresetId,
  BowStyleId,
  MAX_STEMS_GLOBAL,
  OccasionSlug,
  RibbonColorId,
  RibbonFinishId,
  TABLE_SURFACE_IDS,
  VESSEL_RULES,
  VesselId,
  WAX_SEAL_COLOR_IDS,
} from "@/engine/types";
import { CATALOG_ENTRIES, CATALOG_META_MAP } from "@/generated/catalog-manifest";
import { CARD_MESSAGE_STARTERS, CARD_TEMPLATE_META, resolveCardAppearance } from "@/lib/card-styles";
import {
  BOW_LABELS,
  RIBBON_FINISH_LABELS,
  RIBBON_SWATCHES,
  WAX_SWATCHES,
} from "@/lib/studio-labels";
import { trackPrivacySafeEvent } from "@/lib/analytics";
import { BouquetCanvasDisplay } from "@/components/unboxing/BouquetCanvasDisplay";
import { PhotoCropperAttachment } from "./PhotoCropperAttachment";
import { VoiceMessageRecorder } from "./VoiceMessageRecorder";
import { useStudioScene } from "./StudioSceneProvider";

export type QuickCreateStep = 1 | 2 | 3 | 4 | 5;

const QUICK_STEPS: ReadonlyArray<{
  step: QuickCreateStep;
  mobileLabel: string;
  label: string;
}> = [
  { step: 1, mobileLabel: "Occasion", label: "1. Occasion" },
  { step: 2, mobileLabel: "Style", label: "2. Style" },
  { step: 3, mobileLabel: "Customize", label: "3. Customize" },
  { step: 4, mobileLabel: "Personalize", label: "4. Personalize" },
  { step: 5, mobileLabel: "Share", label: "5. Share" },
];

/**
 * SCREEN 1: The 8 curated visual occasions requested for Quick Create.
 */
export const QUICK_EIGHT_OCCASIONS: ReadonlyArray<{
  slug: OccasionSlug;
  alias?: string;
  label: string;
  tagline: string;
  swatches: readonly string[];
  paletteLabel: string;
}> = [
  {
    slug: "birthday",
    label: "Birthday",
    tagline: "Cheerful golden sunflowers, tulips, meadow aster & chamomile",
    swatches: ["#F7CA42", "#F7BD9F", "#E8A9AE", "#C9AD88"],
    paletteLabel: "Sunlit Marigold & Blush",
  },
  {
    slug: "anniversary",
    label: "Anniversary",
    tagline: "Timeless garden roses, blush peonies & tender eucalyptus",
    swatches: ["#E8A9AE", "#D47385", "#C9AD88", "#5A6B5C"],
    paletteLabel: "Heirloom Crimson & Silk",
  },
  {
    slug: "romance",
    alias: "love",
    label: "Love",
    tagline: "Velvety crimson roses, romantic peonies & delicate baby's breath",
    swatches: ["#DA8E98", "#8E2130", "#EAD6D1", "#781E2B"],
    paletteLabel: "Velvet Rose & Petals",
  },
  {
    slug: "thank-you",
    label: "Thank You",
    tagline: "Warm coral ranunculus, peach tones & fragrant greens",
    swatches: ["#F28D77", "#E5B292", "#C9AD88", "#647B66"],
    paletteLabel: "Gratitude & Coral Glow",
  },
  {
    slug: "friendship",
    label: "Friendship",
    tagline: "Sunny chamomiles, yellow tulips, lavender & cheerful aster",
    swatches: ["#F9D048", "#A07CA8", "#B2C9AB", "#D49B85"],
    paletteLabel: "Bright Chamomile Meadow",
  },
  {
    slug: "wedding",
    label: "Wedding",
    tagline: "Pure ivory magnolias, white camellias, white lilies & sage ribbon",
    swatches: ["#FBF8F3", "#E2DEC3", "#8FA189", "#3D4E3F"],
    paletteLabel: "Ivory Atelier & Sage",
  },
  {
    slug: "get-well",
    label: "Get Well Soon",
    tagline: "Soothing lavender, soft pastels, fresh mint & chamomile warmth",
    swatches: ["#9784A4", "#E8DFCF", "#A4B494", "#F4B393"],
    paletteLabel: "Gentle Lavender Breeze",
  },
  {
    slug: "just-because",
    label: "Just Because",
    tagline: "An unexpected gentle reminder that someone is thinking of you",
    swatches: ["#BFA082", "#D9A2A8", "#7B8F77", "#EBE5D8"],
    paletteLabel: "Wildflower Whisper",
  },
];

export type QuickStyleItem = {
  id: "romantic" | "round" | "hand-tied" | "wildflower" | "luxury" | "spring-pastel";
  presetId: CompositionPresetId;
  title: string;
  subtitle: string;
  tagline: string;
  vesselId: VesselId;
  ribbonFinish: RibbonFinishId;
  ribbonColor: RibbonColorId;
  bowStyle: BowStyleId;
  starterId: string;
  badge: string;
};

/**
 * SCREEN 2: Six attractive bouquet arrangement styles with real rendered previews.
 */
export const QUICK_SIX_STYLES: ReadonlyArray<QuickStyleItem> = [
  {
    id: "romantic",
    presetId: "romantic",
    title: "Garden Romance",
    subtitle: "Cascading heirloom roses, blush peonies & soft baby's breath",
    tagline: "Airy, soft, cascading silhouette with layered petals and draped foliage",
    vesselId: "wrap-blush-linen",
    ribbonFinish: "silk",
    ribbonColor: "dusty-rose",
    bowStyle: "silk-tails",
    starterId: "classic-romance",
    badge: "Most Popular",
  },
  {
    id: "round",
    presetId: "round",
    title: "Classic Round",
    subtitle: "Symmetrical European dome with layered blooms & French-tied ribbon",
    tagline: "Balanced European dome with hero focals nested at the crown",
    vesselId: "wrap-blush-linen",
    ribbonFinish: "satin",
    ribbonColor: "silk-cream",
    bowStyle: "double-bow",
    starterId: "miss-you-round",
    badge: "Timeless",
  },
  {
    id: "hand-tied",
    presetId: "hand-tied",
    title: "European Hand-Tied",
    subtitle: "Spiral stem architecture wrapped in artisanal folded kraft paper",
    tagline: "Artisanal florist clutch with collared foliage and spiral flare",
    vesselId: "wrap-natural-kraft",
    ribbonFinish: "satin",
    ribbonColor: "champagne-gold",
    bowStyle: "minimal-knot",
    starterId: "quiet-apology",
    badge: "Artisanal",
  },
  {
    id: "wildflower",
    presetId: "wildflower",
    title: "Wildflower Garden",
    subtitle: "Organic meadow silhouette with dancing sunflowers, aster & chamomile",
    tagline: "Airy polychromatic meadow halo with lavender, chamomile & sprigs",
    vesselId: "wrap-ivory-parchment",
    ribbonFinish: "twine",
    ribbonColor: "natural-twine",
    bowStyle: "minimal-knot",
    starterId: "sunlit-birthday",
    badge: "Whimsical",
  },
  {
    id: "luxury",
    presetId: "luxury",
    title: "Luxury Rose Bouquet",
    subtitle: "Velvety crimson garden roses framed by seeded eucalyptus & charcoal wrap",
    tagline: "Dense, velvety heirloom roses framed by silk tails and dark linen",
    vesselId: "wrap-midnight-charcoal",
    ribbonFinish: "velvet",
    ribbonColor: "velvet-burgundy",
    bowStyle: "double-bow",
    starterId: "evening-velvet-luxury",
    badge: "Opulent",
  },
  {
    id: "spring-pastel",
    presetId: "spring-pastel",
    title: "Spring Pastel",
    subtitle: "Tilted tulips, peach ranunculus & ivory blooms wrapped in sage cotton",
    tagline: "Cupped pastel tulips, blush peonies, ranunculus & eucalyptus",
    vesselId: "wrap-sage-cotton",
    ribbonFinish: "silk",
    ribbonColor: "sage-satin",
    bowStyle: "silk-tails",
    starterId: "spring-pastel-meadow",
    badge: "Delicate",
  },
];

/**
 * Photorealistic greenery SKUs for one-click foliage addition.
 */
const QUICK_GREENERY_SKUS: ReadonlyArray<{ skuId: string; name: string; botanical: string }> = [
  { skuId: "eucalyptus-silver", name: "Silver Dollar Eucalyptus", botanical: "Eucalyptus cinerea" },
  { skuId: "ruscus-italian", name: "Italian Ruscus", botanical: "Ruscus hypoglossum" },
  { skuId: "olive-branch", name: "Olive Branch", botanical: "Olea europaea" },
  { skuId: "leatherleaf-fern", name: "Leatherleaf Fern", botanical: "Rumohra adiantiformis" },
  { skuId: "salal-lemon-leaf", name: "Salal Lemon Leaf", botanical: "Gaultheria shallon" },
  { skuId: "eucalyptus-seeded", name: "Seeded Eucalyptus", botanical: "Eucalyptus parvula" },
  { skuId: "pittosporum-variegated", name: "Variegated Pittosporum", botanical: "Pittosporum tobira" },
  { skuId: "pine-sprig", name: "Pine Sprig", botanical: "Pinus strobus" },
];

/**
 * Color palettes for Screen 3 flower color filters.
 */
const FLOWER_COLOR_FILTERS: ReadonlyArray<{ id: string; label: string; swatch: string }> = [
  { id: "all", label: "All Colors", swatch: "conic-gradient(from 180deg, #F87171, #FBBF24, #34D399, #60A5FA, #A78BFA, #F472B6)" },
  { id: "blush", label: "Blush Pink", swatch: "#E8A9AE" },
  { id: "crimson", label: "Velvet Red", swatch: "#9E1C2E" },
  { id: "gold", label: "Golden Sun", swatch: "#EAB308" },
  { id: "ivory", label: "Pure Ivory", swatch: "#F8F6F0" },
  { id: "peach", label: "Peach & Coral", swatch: "#FB923C" },
  { id: "lavender", label: "Lavender", swatch: "#A855F7" },
];

const WRAP_VESSEL_OPTIONS: ReadonlyArray<VesselId> = [
  "wrap-blush-linen",
  "wrap-sage-cotton",
  "wrap-natural-kraft",
  "wrap-ivory-parchment",
  "wrap-midnight-charcoal",
  "wrap-transparent-cellophane",
  "vase-clear-glass",
];

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
    loadStarterPreset,
    setVessel,
    setBowStyle,
    setRibbonFinish,
    setRibbonColor,
    setTableSurface,
    addStem,
    removeOneBySku,
    resetArrangement,
    updateCard,
    publishShareLink,
    shareState,
    isPublishing,
  } = useStudioScene();

  const [step, setStep] = useState<QuickCreateStep>(1);
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>("all");
  const [customizeSubTab, setCustomizeSubTab] = useState<"flowers" | "wrapping" | "ribbon" | "greenery">("flowers");
  const [copiedLink, setCopiedLink] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<"png" | "jpg" | null>(null);
  const [testingReveal, setTestingReveal] = useState(false);
  const [revealedInPreview, setRevealedInPreview] = useState(true);
  const [mobilePreviewExpanded, setMobilePreviewExpanded] = useState(false);

  // Precomputed real rendered scenes for the 6 attractive bouquet styles
  const styleScenes = useMemo(() => {
    return QUICK_SIX_STYLES.map((style) => {
      const starter = STARTER_BOUQUETS.find((b) => b.id === style.starterId) ?? STARTER_BOUQUETS[0]!;
      return {
        styleId: style.id,
        scene: buildSceneFromPreset(starter, CATALOG_META_MAP),
      };
    });
  }, []);

  const currentOccasionMeta = scene.occasionTag ? OCCASION_TEMPLATES[scene.occasionTag] : undefined;
  const currentPresetMeta =
    COMPOSITION_PRESET_LABELS[scene.presentation.compositionPreset] ?? COMPOSITION_PRESET_LABELS.round;
  const cardAppearance = useMemo(() => resolveCardAppearance(scene.card), [scene.card]);

  // Group current stems by SKU
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

  // Filter catalog by color filter
  const filteredCatalog = useMemo(() => {
    return CATALOG_ENTRIES.filter((item) => {
      if (item.role === "foliage") return false;
      if (selectedColorFilter === "all") return true;
      const lowerColor = (item.colorAnchor || "").toLowerCase();
      const lowerName = item.name.toLowerCase();
      switch (selectedColorFilter) {
        case "blush":
          return lowerColor.includes("blush") || lowerColor.includes("pink") || lowerName.includes("blush");
        case "crimson":
          return lowerColor.includes("crimson") || lowerColor.includes("burgundy") || lowerColor.includes("red") || lowerName.includes("crimson");
        case "gold":
          return lowerColor.includes("gold") || lowerColor.includes("yellow") || lowerColor.includes("amber") || lowerName.includes("sunflower");
        case "ivory":
          return lowerColor.includes("white") || lowerColor.includes("ivory") || lowerColor.includes("cream") || lowerName.includes("white") || lowerName.includes("ivory");
        case "peach":
          return lowerColor.includes("peach") || lowerColor.includes("coral") || lowerColor.includes("apricot");
        case "lavender":
          return lowerColor.includes("purple") || lowerColor.includes("lavender") || lowerColor.includes("violet") || lowerName.includes("lavender");
        default:
          return true;
      }
    });
  }, [selectedColorFilter]);

  const maxReached = scene.stems.length >= MAX_STEMS_GLOBAL;

  // Handle Share Link Copy
  const handleCopyShareLink = async () => {
    let url = "";
    if (shareState?.shareUrl) {
      url = `${window.location.origin}${shareState.shareUrl}`;
    } else {
      const res = await publishShareLink();
      if (res?.shareUrl) {
        url = `${window.location.origin}${res.shareUrl}`;
      }
    }
    if (url) {
      try {
        if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
        }
      } catch {
        // Fallback for sandboxed or headless test environments without clipboard permissions
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
      trackPrivacySafeEvent("bouquet_published");
    }
  };

  // Handle WhatsApp Share
  const handleWhatsAppShare = async () => {
    let url = "";
    if (shareState?.shareUrl) {
      url = `${window.location.origin}${shareState.shareUrl}`;
    } else {
      const res = await publishShareLink();
      if (res?.shareUrl) {
        url = `${window.location.origin}${res.shareUrl}`;
      }
    }
    const recipient = scene.card.recipientName ? ` for ${scene.card.recipientName}` : "";
    const text = `I arranged a fresh digital bouquet${recipient} on Petal & Prose! 🌸\n\nOpen it here: ${url || window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    trackPrivacySafeEvent("bouquet_published");
  };

  // Handle High-Res Export Download
  const handleDownload = async (mime: "image/png" | "image/jpeg") => {
    const fmt = mime === "image/png" ? "png" : "jpg";
    setExportingFormat(fmt);
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
      trackPrivacySafeEvent(fmt === "png" ? "export_png" : "export_jpg");
    } finally {
      setExportingFormat(null);
    }
  };

  const handleToggleTestReveal = () => {
    if (testingReveal) {
      setTestingReveal(false);
      setRevealedInPreview(true);
    } else {
      setTestingReveal(true);
      setRevealedInPreview(false);
    }
  };

  return (
    <div
      data-testid="quick-create-mode"
      className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[var(--bg-canvas)] lg:grid lg:grid-cols-12 lg:overflow-hidden"
    >
      {/* ========================================================================= */}
      {/* LEFT AREA: Dominant Live Bouquet Canvas (Museum Framed)                   */}
      {/* ========================================================================= */}
      <section
        aria-label="Live bouquet preview"
        className={`shrink-0 border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-3 lg:col-span-6 lg:flex lg:flex-col lg:justify-between lg:overflow-y-auto lg:border-r lg:border-b-0 lg:p-6 xl:col-span-6 ${
          step === 5 ? "lg:col-span-7 xl:col-span-7" : ""
        }`}
      >
        <div className="mx-auto flex w-full max-w-[560px] flex-col gap-2.5">
          {/* Ambient Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="rounded-full border border-[var(--border-hairline)] bg-white px-2.5 py-1 font-medium text-[var(--text-primary)]">
                {currentOccasionMeta ? currentOccasionMeta.label : "Custom Arrangement"}
              </span>
              <span className="rounded-full bg-[var(--bg-well)] px-2.5 py-1 text-[var(--text-secondary)]">
                {currentPresetMeta.label}
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
              mobilePreviewExpanded ? "h-[380px]" : "h-[250px] sm:h-[300px]"
            } lg:h-auto lg:aspect-[5/6] lg:max-h-[calc(100dvh-200px)]`}
          >
            <BouquetCanvasDisplay
              scene={scene}
              width={800}
              height={960}
              includeColophon={scene.showColophon}
              className="h-full w-full object-contain"
            />
          </div>

          {/* Step 5 Wax-Seal Live Preview Interactive Overlay */}
          {step === 5 && (
            <div
              data-testid="step5-final-preview"
              className="rounded-2xl border border-[var(--border-hairline)] bg-white p-3 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    Wax-Sealed Unboxing Experience
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {testingReveal
                      ? revealedInPreview
                        ? "Card unfolded · Envelope opened ✓"
                        : "Envelope sealed with wax seal. Tap below to test opening!"
                      : "Simulate recipient unboxing before sending"}
                  </p>
                </div>
                <button
                  type="button"
                  data-testid="preview-reveal-btn"
                  onClick={handleToggleTestReveal}
                  className="rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                >
                  {testingReveal ? "Reset View" : "Test Wax Seal"}
                </button>
              </div>

              {testingReveal && !revealedInPreview && (
                <div className="mt-3 flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4 text-center">
                  <p className="text-xs text-[var(--text-secondary)]">
                    To: <strong className="text-[var(--text-primary)]">{scene.card.recipientName || "Someone Special"}</strong>
                  </p>
                  <button
                    type="button"
                    data-testid="preview-wax-seal-btn"
                    onClick={() => setRevealedInPreview(true)}
                    className="mt-2.5 flex items-center gap-2 rounded-full bg-[#B59145] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:scale-105"
                  >
                    <span>Break Wax Seal &amp; Open Letter</span>
                    <span className="text-sm">✉</span>
                  </button>
                </div>
              )}

              {testingReveal && revealedInPreview && (
                <div
                  className="mt-3 rounded-xl border p-4 text-center transition"
                  style={{
                    backgroundColor: cardAppearance.backgroundColor,
                    borderColor: cardAppearance.borderColor,
                    color: cardAppearance.textColor,
                  }}
                >
                  <p className="text-xs italic">
                    &ldquo;{scene.card.message || "Thinking of you with fresh blooms."}&rdquo;
                  </p>
                  <p className="mt-2 text-[11px] font-medium opacity-80">
                    — {scene.card.senderName || "With love"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Gentle Advanced Studio Escape Hatch */}
          <div className="hidden items-center justify-between rounded-2xl border border-[var(--border-hairline)] bg-white/80 px-4 py-2.5 text-xs text-[var(--text-secondary)] lg:flex">
            <span>Want manual stem dragging, angle rotation &amp; depth layering?</span>
            <button
              type="button"
              data-testid="quick-open-studio-btn"
              onClick={onSwitchToStudio}
              className="font-semibold text-[var(--accent-primary)] hover:underline"
            >
              Advanced Studio →
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* RIGHT AREA: 5 Guided Steps Deck                                          */}
      {/* ========================================================================= */}
      <section
        aria-label="Quick Create guided steps"
        className={`flex min-h-0 flex-1 flex-col bg-[var(--bg-surface)] ${
          step === 5 ? "lg:col-span-5 xl:col-span-5" : "lg:col-span-6"
        } lg:overflow-hidden`}
      >
        {/* Progress Navigation Strip */}
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

        {/* Step Body */}
        <div className="flex-1 space-y-5 p-4 sm:p-6 lg:overflow-y-auto">
          {/* ==================== SCREEN 1: CHOOSE AN OCCASION ==================== */}
          {step === 1 && (
            <div className="space-y-4" data-testid="quick-step1-occasion">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h1 className="font-display text-2xl font-medium text-[var(--text-primary)] sm:text-3xl">
                    Choose an Occasion
                  </h1>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Pick the feeling behind your bouquet. We will curate the perfect color palette and blooms.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenAi}
                  className="min-h-[36px] shrink-0 rounded-full border border-[var(--accent-primary)]/40 bg-[var(--accent-primary-soft)] px-3 text-xs font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white"
                >
                  Ask AI Florist
                </button>
              </div>

              {/* Visual 8 Occasion Cards */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {QUICK_EIGHT_OCCASIONS.map((occ) => {
                  const selected =
                    scene.occasionTag === occ.slug || (occ.alias && scene.occasionTag === occ.alias);
                  return (
                    <button
                      key={occ.slug}
                      type="button"
                      data-testid={`quick-occasion-${occ.slug}`}
                      onClick={() => applyOccasionTemplate(occ.slug, "full")}
                      className={`group flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)]/70 ring-2 ring-[var(--accent-primary)]/50"
                          : "border-[var(--border-hairline)] bg-white hover:border-[var(--border-strong)]"
                      }`}
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <span className="font-display text-xl font-medium text-[var(--text-primary)]">
                          {occ.label}
                        </span>
                        <div className="flex shrink-0 items-center gap-1 pt-1">
                          {occ.swatches.map((hex, i) => (
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
                      <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-[var(--accent-primary)]">
                        <span>{occ.paletteLabel}</span>
                        <span>{selected ? "Selected ✓" : "Choose →"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== SCREEN 2: CHOOSE A STYLE ==================== */}
          {step === 2 && (
            <div className="space-y-6" data-testid="quick-step2-style">
              <div>
                <h1 className="font-display text-2xl font-medium text-[var(--text-primary)] sm:text-3xl">
                  Choose a Bouquet Style
                </h1>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Select from six florist arrangement silhouettes, complete with artisanal wrapping and ribbons.
                </p>
              </div>

              {/* 6 Attractive Bouquet Examples with Real Rendered Previews */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {QUICK_SIX_STYLES.map((style) => {
                  const active = scene.presentation.compositionPreset === style.presetId;
                  const previewScene =
                    styleScenes.find((s: { styleId: string; scene: typeof scene }) => s.styleId === style.id)?.scene ?? scene;

                  return (
                    <button
                      key={style.id}
                      type="button"
                      data-testid={`quick-preset-${style.presetId}`}
                      onClick={() => {
                        applyCompositionPreset(style.presetId);
                        setVessel(style.vesselId);
                        setRibbonFinish(style.ribbonFinish);
                        setRibbonColor(style.ribbonColor);
                        setBowStyle(style.bowStyle);
                        if (scene.stems.length === 0) {
                          loadStarterPreset(style.starterId);
                        }
                      }}
                      className={`group flex flex-col overflow-hidden rounded-2xl border text-left transition ${
                        active
                          ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)]/30 ring-2 ring-[var(--accent-primary)]"
                          : "border-[var(--border-hairline)] bg-white hover:border-[var(--border-strong)]"
                      }`}
                    >
                      {/* Real Rendered Bouquet Canvas Preview */}
                      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--bg-canvas)] p-2">
                        <span className="absolute top-2 left-2 z-10 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[var(--text-primary)] shadow-2xs backdrop-blur-xs">
                          {style.badge}
                        </span>
                        <BouquetCanvasDisplay
                          scene={previewScene}
                          width={320}
                          height={400}
                          className="h-full w-full object-contain transition group-hover:scale-102"
                        />
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-3.5">
                        <div>
                          <p className="font-display text-lg font-medium text-[var(--text-primary)]">
                            {style.title}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                            {style.tagline}
                          </p>
                        </div>
                        <span
                          className={`mt-3 block text-xs font-semibold ${
                            active ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                          }`}
                        >
                          {active ? "Arrangement Selected ✓" : "Select Style →"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Optional Fine-Tuning Wrapping & Surface (for tests & power polish) */}
              <details open className="rounded-2xl border border-[var(--border-hairline)] bg-white p-4">
                <summary className="cursor-pointer text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  Fine-tune wrapping paper &amp; backdrop surface (Optional)
                </summary>
                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="mb-2 text-xs font-semibold text-[var(--text-primary)]">
                      Wrapping Texture
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {WRAP_VESSEL_OPTIONS.map((vid) => {
                        const rule = VESSEL_RULES[vid];
                        const active = scene.presentation.vesselId === vid;
                        return (
                          <button
                            key={vid}
                            type="button"
                            data-testid={`quick-vessel-${vid}`}
                            onClick={() => setVessel(vid)}
                            className={`flex flex-col items-start rounded-xl border p-2 text-left transition ${
                              active
                                ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] ring-1 ring-[var(--accent-primary)]"
                                : "border-[var(--border-hairline)] bg-white"
                            }`}
                          >
                            <span
                              className="mb-1.5 h-4 w-full rounded border border-black/10"
                              style={{ backgroundColor: rule.swatchHex }}
                            />
                            <span className="text-[11px] font-medium text-[var(--text-primary)] truncate w-full">
                              {rule.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-xs font-semibold text-[var(--text-primary)]">
                      Studio Backdrop Surface
                    </h3>
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
                            className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs transition ${
                              active
                                ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] ring-1 ring-[var(--accent-primary)]"
                                : "border-[var(--border-hairline)] bg-white"
                            }`}
                          >
                            <span
                              className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/15"
                              style={{ background: t.bgTop }}
                            />
                            <span className="truncate text-[11px]">{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </details>
            </div>
          )}

          {/* ==================== SCREEN 3: CUSTOMIZE ==================== */}
          {step === 3 && (
            <div className="space-y-5" data-testid="quick-step3-flowers">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h1 className="font-display text-2xl font-medium text-[var(--text-primary)] sm:text-3xl">
                    Customize Your Blooms
                  </h1>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    All controls are optional. You can adjust colors, replace stems, change wrapping, or add fresh greenery.
                  </p>
                </div>
                <button
                  type="button"
                  data-testid="quick-shuffle-btn"
                  onClick={resetArrangement}
                  className="min-h-[36px] rounded-full border border-[var(--border-hairline)] bg-white px-3 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                >
                  ↻ Refresh Arrangement
                </button>
              </div>

              {/* Sub-Tabs: Flowers / Greenery / Wrapping / Ribbon */}
              <div className="flex flex-wrap gap-1.5 border-b border-[var(--border-hairline)] pb-3">
                <button
                  type="button"
                  onClick={() => setCustomizeSubTab("flowers")}
                  className={`min-h-[34px] rounded-full px-4 text-xs font-semibold transition ${
                    customizeSubTab === "flowers"
                      ? "bg-[var(--text-primary)] text-white shadow-2xs"
                      : "border border-[var(--border-hairline)] bg-white text-[var(--text-secondary)]"
                  }`}
                >
                  Flower Blooms
                </button>
                <button
                  type="button"
                  onClick={() => setCustomizeSubTab("greenery")}
                  className={`min-h-[34px] rounded-full px-4 text-xs font-semibold transition ${
                    customizeSubTab === "greenery"
                      ? "bg-[var(--text-primary)] text-white shadow-2xs"
                      : "border border-[var(--border-hairline)] bg-white text-[var(--text-secondary)]"
                  }`}
                >
                  + Add Greenery
                </button>
                <button
                  type="button"
                  onClick={() => setCustomizeSubTab("wrapping")}
                  className={`min-h-[34px] rounded-full px-4 text-xs font-semibold transition ${
                    customizeSubTab === "wrapping"
                      ? "bg-[var(--text-primary)] text-white shadow-2xs"
                      : "border border-[var(--border-hairline)] bg-white text-[var(--text-secondary)]"
                  }`}
                >
                  Wrapping
                </button>
                <button
                  type="button"
                  onClick={() => setCustomizeSubTab("ribbon")}
                  className={`min-h-[34px] rounded-full px-4 text-xs font-semibold transition ${
                    customizeSubTab === "ribbon"
                      ? "bg-[var(--text-primary)] text-white shadow-2xs"
                      : "border border-[var(--border-hairline)] bg-white text-[var(--text-secondary)]"
                  }`}
                >
                  Ribbon &amp; Bow
                </button>
              </div>

              {/* Current Stems Summary Strip (Replace / Modify) */}
              <div className="rounded-2xl border border-[var(--border-hairline)] bg-white p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    In Your Bouquet ({scene.stems.length} stems)
                  </p>
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    Tap − or + to replace or balance stems
                  </span>
                </div>
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
                        data-testid={`quick-add-stem-${skuId}`}
                        onClick={() => addStem(skuId)}
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-primary)] text-xs font-bold text-white disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SUBTAB 1: FLOWERS & COLOR PALETTE SWITCHER */}
              {customizeSubTab === "flowers" && (
                <div className="space-y-3">
                  <div>
                    <h3 className="mb-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                      Filter Flower Colors
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {FLOWER_COLOR_FILTERS.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setSelectedColorFilter(f.id)}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            selectedColorFilter === f.id
                              ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] text-[var(--text-primary)] font-semibold"
                              : "border-[var(--border-hairline)] bg-white text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                          }`}
                        >
                          <span
                            className="h-3 w-3 rounded-full border border-black/20"
                            style={{ background: f.swatch }}
                          />
                          <span>{f.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

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
                              className="min-h-[32px] flex-1 rounded-lg bg-[var(--accent-primary)] px-2 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)] disabled:opacity-45"
                            >
                              + Add
                            </button>
                            {countInBouquet > 0 && (
                              <button
                                type="button"
                                data-testid={`quick-remove-stem-${item.skuId}`}
                                onClick={() => removeOneBySku(item.skuId)}
                                className="min-h-[32px] rounded-lg border border-[var(--border-hairline)] px-2.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-well)]"
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
              )}

              {/* SUBTAB 2: GREENERY QUICK-ADD SHELF */}
              {customizeSubTab === "greenery" && (
                <div className="space-y-3">
                  <p className="text-xs text-[var(--text-secondary)]">
                    Professional florists tuck fresh greenery around the base to frame hero blooms and create natural volume.
                  </p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {QUICK_GREENERY_SKUS.map((g) => {
                      const meta = CATALOG_META_MAP.get(g.skuId);
                      const inBouquet =
                        groupedSelectedStems.find((s) => s.skuId === g.skuId)?.count ?? 0;
                      return (
                        <div
                          key={g.skuId}
                          className="flex items-center justify-between rounded-2xl border border-[var(--border-hairline)] bg-white p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-[var(--bg-canvas)] p-1">
                              {meta && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={meta.thumbPath}
                                  alt={g.name}
                                  className="h-full w-full object-contain"
                                />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[var(--text-primary)]">
                                {g.name}
                              </p>
                              <p className="text-[11px] italic text-[var(--text-muted)]">
                                {g.botanical}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {inBouquet > 0 && (
                              <button
                                type="button"
                                onClick={() => removeOneBySku(g.skuId)}
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-white text-xs font-bold text-[var(--text-secondary)]"
                              >
                                −
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={maxReached}
                              data-testid={`quick-add-greenery-${g.skuId}`}
                              onClick={() => addStem(g.skuId)}
                              className="rounded-full bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[var(--accent-primary-hover)] disabled:opacity-40"
                            >
                              + Add {inBouquet > 0 ? `(${inBouquet})` : ""}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUBTAB 3: WRAPPING OPTIONS */}
              {customizeSubTab === "wrapping" && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-[var(--text-primary)]">
                    Artisanal Paper &amp; Linen Wraps
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {WRAP_VESSEL_OPTIONS.map((vid) => {
                      const rule = VESSEL_RULES[vid];
                      const active = scene.presentation.vesselId === vid;
                      return (
                        <button
                          key={vid}
                          type="button"
                          data-testid={`quick-vessel-${vid}`}
                          onClick={() => setVessel(vid)}
                          className={`flex flex-col rounded-2xl border p-3 text-left transition ${
                            active
                              ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] ring-2 ring-[var(--accent-primary)]"
                              : "border-[var(--border-hairline)] bg-white hover:border-[var(--border-strong)]"
                          }`}
                        >
                          <span
                            className="mb-2 h-8 w-full rounded-lg border border-black/10"
                            style={{ backgroundColor: rule.swatchHex }}
                          />
                          <span className="text-xs font-semibold text-[var(--text-primary)]">
                            {rule.label}
                          </span>
                          <span className="mt-1 text-[11px] text-[var(--text-secondary)]">
                            {active ? "Currently Wrapped ✓" : "Apply Wrap →"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUBTAB 4: RIBBON & BOW */}
              {customizeSubTab === "ribbon" && (
                <div className="space-y-4 rounded-2xl border border-[var(--border-hairline)] bg-white p-4">
                  <div>
                    <h3 className="mb-2 text-xs font-semibold text-[var(--text-primary)]">
                      Ribbon Texture
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {(["satin", "silk", "velvet", "twine"] as const).map((rf) => {
                        const active = (scene.presentation.ribbonFinishId ?? "satin") === rf;
                        return (
                          <button
                            key={rf}
                            type="button"
                            onClick={() => setRibbonFinish(rf)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
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
                    <h3 className="mb-2 text-xs font-semibold text-[var(--text-primary)]">
                      Bow Style
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {BOW_STYLE_IDS.map((bid) => {
                        const active = scene.presentation.bowStyleId === bid;
                        return (
                          <button
                            key={bid}
                            type="button"
                            onClick={() => setBowStyle(bid)}
                            className={`rounded-xl border p-2.5 text-left text-xs transition ${
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

                  <div>
                    <h3 className="mb-2 text-xs font-semibold text-[var(--text-primary)]">
                      Ribbon Shade
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        [
                          "silk-cream",
                          "velvet-burgundy",
                          "sage-satin",
                          "champagne-gold",
                          "dusty-rose",
                          "natural-twine",
                        ] as const
                      ).map((rc) => {
                        const meta = RIBBON_SWATCHES[rc];
                        const active = scene.presentation.ribbonColorId === rc;
                        return (
                          <button
                            key={rc}
                            type="button"
                            onClick={() => setRibbonColor(rc)}
                            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
                              active
                                ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] font-semibold"
                                : "border-[var(--border-hairline)] bg-white"
                            }`}
                          >
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-black/20"
                              style={{ backgroundColor: meta?.hex ?? "#C9AD88" }}
                            />
                            <span>{meta?.label ?? rc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== SCREEN 4: PERSONALIZE ==================== */}
          {step === 4 && (
            <div className="space-y-5" data-testid="quick-step4-card">
              <div>
                <h1 className="font-display text-2xl font-medium text-[var(--text-primary)] sm:text-3xl">
                  Personalize Your Card
                </h1>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Add recipient and sender details, write a heartfelt message, and optionally include photo or voice keepsakes.
                </p>
              </div>

              {/* Core Recipient, Sender, Message Form */}
              <div className="space-y-4 rounded-2xl border border-[var(--border-hairline)] bg-white p-4 sm:p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">
                    Recipient Name (To)
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
                    Sender Name (From)
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

                <label className="block text-xs font-medium text-[var(--text-secondary)]">
                  Personal Message ({scene.card.message.length}/400)
                  <textarea
                    rows={4}
                    maxLength={400}
                    placeholder="Write a heartfelt message…"
                    value={scene.card.message}
                    onChange={(e) => updateCard({ message: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2.5 text-sm leading-relaxed text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                  />
                </label>

                {/* Quick Note Starters */}
                <div>
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Thoughtful Message Starters
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {CARD_MESSAGE_STARTERS.map((starter) => (
                      <button
                        key={starter.label}
                        type="button"
                        onClick={() => updateCard({ message: starter.text })}
                        className="rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                      >
                        + {starter.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stationery Templates */}
              <div className="space-y-3 rounded-2xl border border-[var(--border-hairline)] bg-white p-4">
                <span className="block text-xs font-semibold text-[var(--text-primary)]">
                  Fine Paper Stationery Template
                </span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {CARD_TEMPLATE_IDS.map((tid) => {
                    const active = scene.card.templateId === tid;
                    return (
                      <button
                        key={tid}
                        type="button"
                        onClick={() => updateCard({ templateId: tid, envelopeId: tid })}
                        className={`min-h-[36px] rounded-xl border px-3 text-xs font-medium transition ${
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

              {/* Envelope Wax Seal Swatches */}
              <div className="space-y-2 rounded-2xl border border-[var(--border-hairline)] bg-white p-4">
                <span className="block text-xs font-semibold text-[var(--text-primary)]">
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
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
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

              {/* Optional Photo & Voice Attachments */}
              <div className="space-y-3 rounded-2xl border border-[var(--border-hairline)] bg-white p-4">
                <span className="block text-xs font-semibold text-[var(--text-primary)]">
                  Optional Keepsake Attachments
                </span>
                <p className="text-xs text-[var(--text-secondary)]">
                  Add a personal photo memory or voice greeting to play during the unboxing experience.
                </p>
                <div className="space-y-3 pt-2">
                  <PhotoCropperAttachment />
                  <VoiceMessageRecorder />
                </div>
              </div>
            </div>
          )}

          {/* ==================== SCREEN 5: SHARE ==================== */}
          {step === 5 && (
            <div className="space-y-5" data-testid="quick-step5-share">
              <div>
                <h1 className="font-display text-2xl font-medium text-[var(--text-primary)] sm:text-3xl">
                  Sealed &amp; Ready to Share
                </h1>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Your floral arrangement is finished. Send your private gift link, share on WhatsApp, or download high-resolution art.
                </p>
              </div>

              {/* Share Actions Grid */}
              <div className="space-y-3 rounded-2xl border border-[var(--border-hairline)] bg-white p-4 sm:p-5">
                {/* 1. Copy Link */}
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={isPublishing}
                    data-testid="publish-share-btn"
                    onClick={handleCopyShareLink}
                    className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-[var(--accent-primary-hover)] disabled:opacity-50"
                  >
                    <span>{copiedLink ? "✓ Link Copied to Clipboard!" : isPublishing ? "Generating Private Link…" : "Copy Shareable Link"}</span>
                  </button>

                  {/* Share result URL box */}
                  <div
                    data-testid="share-result-box"
                    className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-secondary)]"
                  >
                    <span className="truncate">
                      {shareState?.shareUrl
                        ? `${typeof window !== "undefined" ? window.location.origin : ""}${shareState.shareUrl}`
                        : "Private link will be generated automatically"}
                    </span>
                    <button
                      type="button"
                      data-testid="copy-link-btn"
                      onClick={handleCopyShareLink}
                      className="ml-2 shrink-0 font-semibold text-[var(--accent-primary)] hover:underline"
                    >
                      {copiedLink ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* 2. WhatsApp Share */}
                <button
                  type="button"
                  data-testid="whatsapp-share-btn"
                  onClick={handleWhatsAppShare}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-emerald-600 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700"
                >
                  <span>Share on WhatsApp</span>
                  <span className="text-sm">💬</span>
                </button>

                {/* 3. Download Image */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-hairline)]">
                  <button
                    type="button"
                    disabled={Boolean(exportingFormat)}
                    data-testid="export-download-btn"
                    onClick={() => handleDownload("image/png")}
                    className="flex min-h-[40px] items-center justify-center rounded-xl border border-[var(--border-hairline)] bg-white px-3 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)] disabled:opacity-50"
                  >
                    {exportingFormat === "png" ? "Preparing PNG…" : "Download High-Res PNG"}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(exportingFormat)}
                    data-testid="download-jpg-btn"
                    onClick={() => handleDownload("image/jpeg")}
                    className="flex min-h-[40px] items-center justify-center rounded-xl border border-[var(--border-hairline)] bg-white px-3 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)] disabled:opacity-50"
                  >
                    {exportingFormat === "jpg" ? "Preparing JPG…" : "Download JPG"}
                  </button>
                </div>

                {/* 4. Preview Recipient Experience */}
                <div className="pt-2 border-t border-[var(--border-hairline)]">
                  <button
                    type="button"
                    data-testid="preview-unboxing-experience-btn"
                    onClick={() => {
                      if (shareState?.shareUrl) {
                        window.open(shareState.shareUrl, "_blank");
                      } else {
                        handleToggleTestReveal();
                      }
                    }}
                    className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                  >
                    <span>Preview Recipient Experience</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Clean Step Back / Continue Sticky Footer */}
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
