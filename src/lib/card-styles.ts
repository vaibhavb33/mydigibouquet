import {
  CARD_TEMPLATE_IDS,
  CARD_TEXT_COLOR_STYLES,
  CardConfig,
  CardTemplateId,
  PAPER_TINT_STYLES,
} from "@/engine/types";

export const CARD_TEMPLATE_META: Record<
  CardTemplateId,
  {
    label: string;
    defaultPaperTint: CardConfig["paperTintId"];
    defaultTextColor: NonNullable<CardConfig["textColorId"]>;
    frameRule: "double" | "classic" | "editorial" | "soft";
  }
> = {
  "botanical-cream": {
    label: "Botanical Cream",
    defaultPaperTint: "natural",
    defaultTextColor: "charcoal",
    frameRule: "classic",
  },
  "pressed-linen": {
    label: "Pressed Linen",
    defaultPaperTint: "sage",
    defaultTextColor: "forest",
    frameRule: "double",
  },
  "midnight-velvet": {
    label: "Midnight Velvet",
    defaultPaperTint: "charcoal",
    defaultTextColor: "pearl",
    frameRule: "double",
  },
  "deckle-cotton": {
    label: "Deckle Cotton",
    defaultPaperTint: "ivory",
    defaultTextColor: "charcoal",
    frameRule: "soft",
  },
  "blush-parchment": {
    label: "Blush Parchment",
    defaultPaperTint: "blush",
    defaultTextColor: "burgundy",
    frameRule: "classic",
  },
  "minimalist-editorial": {
    label: "Editorial Mono",
    defaultPaperTint: "ivory",
    defaultTextColor: "navy",
    frameRule: "editorial",
  },
};

export const CARD_MESSAGE_STARTERS: ReadonlyArray<{ label: string; text: string }> = [
  {
    label: "Warm Appreciation",
    text: "Thinking of you today and sending fresh blooms filled with gratitude and quiet warmth.",
  },
  {
    label: "Birthday Wish",
    text: "Wishing you a year filled with bright mornings, gentle laughter, and everything that makes you smile.",
  },
  {
    label: "Romantic Note",
    text: "Every flower here was arranged slowly with you in my heart—thank you for coloring every day with joy.",
  },
  {
    label: "Gentle Support",
    text: "Sending these stems across the miles as a small reminder that you are cared for today and always.",
  },
];

export type ResolvedCardAppearance = {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
  isDarkBackground: boolean;
  frameRule: "double" | "classic" | "editorial" | "soft";
  autoContrastAdjusted: boolean;
};

export function resolveCardAppearance(card: CardConfig): ResolvedCardAppearance {
  const paper = PAPER_TINT_STYLES[card.paperTintId] ?? PAPER_TINT_STYLES.natural;
  const templateMeta =
    CARD_TEMPLATE_META[card.templateId as (typeof CARD_TEMPLATE_IDS)[number]] ??
    CARD_TEMPLATE_META["botanical-cream"];
  const requestedInkId = card.textColorId ?? (paper.isDark ? "pearl" : "charcoal");
  const requestedInk = CARD_TEXT_COLOR_STYLES[requestedInkId] ?? CARD_TEXT_COLOR_STYLES.charcoal;

  const darkInksOnDarkBg = new Set(["charcoal", "forest", "burgundy", "navy"]);
  const lightInksOnLightBg = new Set(["pearl"]);

  let finalHex = requestedInk.hex;
  let autoContrastAdjusted = false;

  if (paper.isDark && darkInksOnDarkBg.has(requestedInkId)) {
    finalHex = CARD_TEXT_COLOR_STYLES.pearl.hex;
    autoContrastAdjusted = true;
  } else if (!paper.isDark && lightInksOnLightBg.has(requestedInkId)) {
    finalHex = CARD_TEXT_COLOR_STYLES.charcoal.hex;
    autoContrastAdjusted = true;
  }

  return {
    backgroundColor: paper.bg,
    borderColor: paper.border,
    textColor: finalHex,
    mutedColor: paper.isDark ? "rgba(245, 242, 235, 0.72)" : "rgba(36, 35, 31, 0.68)",
    isDarkBackground: paper.isDark,
    frameRule: templateMeta.frameRule,
    autoContrastAdjusted,
  };
}

