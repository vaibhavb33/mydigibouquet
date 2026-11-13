import {
  BOW_STYLE_IDS,
  RIBBON_COLOR_IDS,
  RibbonFinishId,
  WAX_SEAL_COLOR_IDS,
} from "@/engine/types";

export const RIBBON_SWATCHES: Record<(typeof RIBBON_COLOR_IDS)[number], { label: string; hex: string }> = {
  "silk-cream": { label: "Silk Cream", hex: "#EFE6D4" },
  "velvet-burgundy": { label: "Velvet Burgundy", hex: "#781E2B" },
  "sage-satin": { label: "Sage Satin", hex: "#78927B" },
  "champagne-gold": { label: "Champagne Gold", hex: "#CFB17C" },
  "dusty-rose": { label: "Dusty Rose", hex: "#CA8E95" },
  "natural-twine": { label: "Natural Twine", hex: "#A78A64" },
};

export const BOW_LABELS: Record<(typeof BOW_STYLE_IDS)[number], string> = {
  "double-bow": "Decorative Double Bow",
  "silk-tails": "Silk Tails",
  "minimal-knot": "Minimal Knot",
  "wax-band": "Wax Band",
  none: "No Ribbon",
};

export const RIBBON_FINISH_LABELS: Record<RibbonFinishId, string> = {
  satin: "Satin Ribbon",
  silk: "Silk Ribbon",
  velvet: "Velvet Ribbon",
  twine: "Natural Twine",
};

export const WAX_SWATCHES: Record<(typeof WAX_SEAL_COLOR_IDS)[number], { label: string; hex: string }> = {
  "terracotta-rose": { label: "Terracotta", hex: "#A8564B" },
  "antique-gold": { label: "Antique Gold", hex: "#B59145" },
  "forest-pine": { label: "Forest Pine", hex: "#35513D" },
  "ivory-pearl": { label: "Ivory Pearl", hex: "#E6DFD2" },
  "midnight-ink": { label: "Midnight Ink", hex: "#23252C" },
  champagne: { label: "Champagne", hex: "#CBB084" },
};

export function formatSlugLabel(str: string): string {
  return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

