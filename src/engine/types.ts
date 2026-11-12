export const WORLD_WIDTH = 1000;
export const WORLD_HEIGHT = 1200;
export const COLLAR_ANCHOR_X = 500;
export const COLLAR_ANCHOR_Y = 740;
export const MAX_STEMS_GLOBAL = 18;
export const MIN_STEMS_STANDARD = 3;
export const MIN_STEMS_MINIMALIST = 1;

export type BotanicalRole = "focal" | "filler" | "foliage" | "petal";
export type ColorFamily = "crimson" | "blush" | "ivory" | "amber" | "lavender" | "sage";
export type OccasionSlug =
  | "birthday"
  | "anniversary"
  | "valentines-day"
  | "wedding"
  | "thank-you"
  | "congratulations"
  | "get-well"
  | "apology"
  | "friendship"
  | "mothers-day"
  | "just-because"
  | "romance"
  | "sympathy"
  | "miss-you";

export const CANONICAL_OCCASIONS = [
  "birthday",
  "anniversary",
  "valentines-day",
  "wedding",
  "thank-you",
  "congratulations",
  "get-well",
  "apology",
  "friendship",
  "mothers-day",
  "just-because",
  "romance",
  "sympathy",
  "miss-you",
] as const;

export const VESSEL_IDS = [
  "wrap-natural-kraft",
  "wrap-ivory-parchment",
  "wrap-blush-linen",
  "wrap-textured-weave",
  "wrap-transparent-cellophane",
  "wrap-floral-patterned",
  "wrap-sage-cotton",
  "wrap-midnight-charcoal",
  "vase-clear-glass",
  "vase-cream-ceramic",
  "vase-warm-terracotta",
  "bare-stems",
] as const;
export type VesselId = (typeof VESSEL_IDS)[number];

export const BOW_STYLE_IDS = [
  "double-bow",
  "silk-tails",
  "minimal-knot",
  "wax-band",
  "none",
] as const;
export type BowStyleId = (typeof BOW_STYLE_IDS)[number];

export const RIBBON_FINISH_IDS = ["satin", "silk", "velvet", "twine"] as const;
export type RibbonFinishId = (typeof RIBBON_FINISH_IDS)[number];

export const RIBBON_COLOR_IDS = [
  "silk-cream",
  "velvet-burgundy",
  "sage-satin",
  "champagne-gold",
  "dusty-rose",
  "natural-twine",
] as const;
export type RibbonColorId = (typeof RIBBON_COLOR_IDS)[number];

export const STEM_VISIBILITY_IDS = ["tucked", "exposed", "submerged"] as const;
export type StemVisibility = (typeof STEM_VISIBILITY_IDS)[number];

export const TABLE_SURFACE_IDS = ["linen", "limewash", "travertine", "slate"] as const;
export type TableSurfaceId = (typeof TABLE_SURFACE_IDS)[number];

export const COMPOSITION_PRESET_IDS = [
  "round",
  "hand-tied",
  "romantic",
  "garden",
  "luxury",
  "minimalist",
  "wildflower",
] as const;
export type CompositionPresetId = (typeof COMPOSITION_PRESET_IDS)[number];

export const CARD_TEMPLATE_IDS = [
  "botanical-cream",
  "pressed-linen",
  "midnight-velvet",
  "deckle-cotton",
  "blush-parchment",
  "minimalist-editorial",
] as const;
export type CardTemplateId = (typeof CARD_TEMPLATE_IDS)[number];

export const WAX_SEAL_COLOR_IDS = [
  "terracotta-rose",
  "antique-gold",
  "forest-pine",
  "ivory-pearl",
  "midnight-ink",
  "champagne",
] as const;
export type WaxSealColorId = (typeof WAX_SEAL_COLOR_IDS)[number];

export const FONT_PAIRING_IDS = [
  "editorial-serif",
  "calligraphic",
  "warm-literary",
  "modern-atelier",
] as const;
export type FontPairingId = (typeof FONT_PAIRING_IDS)[number];

export const AUDIO_TRACK_IDS = [
  "acoustic-guitar",
  "warm-piano",
  "gentle-strings",
  "garden-morning",
  "soft-vinyl",
  "silent",
] as const;
export type AudioTrackId = (typeof AUDIO_TRACK_IDS)[number];

export type BotanicalMeta = {
  skuId: string;
  familyId: string;
  speciesSlug: string;
  hasSpeciesPage: boolean;
  colorAnchor: string;
  name: string;
  variantLabel: string;
  role: BotanicalRole;
  colorFamily: ColorFamily;
  colorHex: string;
  meaningShort: string;
  meaningFull: string;
  occasionTags: OccasionSlug[];
  anchorX: number;
  anchorY: number;
  naturalWidth: number;
  naturalHeight: number;
  headRadiusWorld: number;
  stemLengthWorld: number;
  isRadialSymmetric: boolean;
  allowFrontDrape: boolean;
  defaultMinRotDeg: number;
  defaultMaxRotDeg: number;
  thumbPath: string;
  studioPath: string;
  exportPath: string;
  hitmaskPath: string;
};

export type StemInstance = {
  id: string;
  skuId: string;
  x: number;
  y: number;
  scale: number;
  rotationDeg: number;
  flippedX: boolean;
  zIndex: number;
  locked?: boolean;
};

export type PresentationConfig = {
  vesselId: VesselId;
  bowStyleId: BowStyleId;
  ribbonFinishId?: RibbonFinishId;
  ribbonColorId: RibbonColorId;
  stemVisibility: StemVisibility;
  tableSurfaceId: TableSurfaceId;
  compositionPreset: CompositionPresetId;
};

export const PAPER_TINT_IDS = [
  "natural",
  "ivory",
  "blush",
  "sage",
  "charcoal",
] as const;
export type PaperTintId = (typeof PAPER_TINT_IDS)[number];

export const PAPER_TINT_STYLES: Record<
  PaperTintId,
  { label: string; bg: string; border: string; isDark: boolean }
> = {
  natural: { label: "Warm Parchment", bg: "#FAF6EE", border: "#DDD4C3", isDark: false },
  ivory: { label: "Deckle Ivory", bg: "#FDFBF7", border: "#DCD6CA", isDark: false },
  blush: { label: "Blush Rose", bg: "#F6ECEA", border: "#DFC8C4", isDark: false },
  sage: { label: "Botanical Sage", bg: "#EBF0EA", border: "#C4D1C2", isDark: false },
  charcoal: { label: "Midnight Velvet", bg: "#222623", border: "#525850", isDark: true },
};

export const CARD_TEXT_COLOR_IDS = [
  "charcoal",
  "forest",
  "burgundy",
  "navy",
  "gold",
  "pearl",
] as const;
export type CardTextColorId = (typeof CARD_TEXT_COLOR_IDS)[number];

export const CARD_TEXT_COLOR_STYLES: Record<
  CardTextColorId,
  { label: string; hex: string; swatch: string }
> = {
  charcoal: { label: "Atelier Ink", hex: "#24231F", swatch: "#24231F" },
  forest: { label: "Botanical Pine", hex: "#233B2C", swatch: "#233B2C" },
  burgundy: { label: "Claret Rose", hex: "#6E1F2A", swatch: "#6E1F2A" },
  navy: { label: "Midnight Slate", hex: "#233042", swatch: "#233042" },
  gold: { label: "Burnished Gold", hex: "#947028", swatch: "#B59145" },
  pearl: { label: "Ivory Pearl", hex: "#F5F2EB", swatch: "#F5F2EB" },
};

export type CardConfig = {
  templateId: CardTemplateId;
  envelopeId: CardTemplateId;
  waxSealColorId: WaxSealColorId;
  fontPairingId: FontPairingId;
  textAlign: "left" | "center" | "right";
  paperTintId: PaperTintId;
  textColorId?: CardTextColorId;
  enableAnimatedReveal?: boolean;
  showPressedPetalWatermark: boolean;
  recipientName: string;
  senderName: string;
  message: string;
  isVisualOnly: boolean;
  audioTrackId: AudioTrackId;
};

export type PhotoAttachmentRef = {
  id: string;
  url: string;
  caption?: string;
  aspectRatio?: number;
};

export type VoiceMessageRef = {
  id: string;
  url: string;
  mimeType: string;
  durationSec: number;
};

export type BouquetSceneV1 = {
  schemaVersion: 1;
  stems: StemInstance[];
  presentation: PresentationConfig;
  card: CardConfig;
  showColophon: boolean;
  hideNamesInPreview: boolean;
  isPublicShowcase?: boolean;
  occasionTag?: OccasionSlug;
  photos?: PhotoAttachmentRef[];
  voiceMessage?: VoiceMessageRef | null;
};

export type VesselRule = {
  vesselId: VesselId;
  label: string;
  category: "wrap" | "vase" | "minimal";
  supportsBow: boolean;
  allowedStemVisibility: readonly StemVisibility[];
  defaultStemVisibility: StemVisibility;
  collarY: number;
  waterlineY: number | null;
  swatchHex: string;
  pocketMaskPolygon: readonly [number, number][];
};

export const VESSEL_RULES: Record<VesselId, VesselRule> = {
  "wrap-blush-linen": {
    vesselId: "wrap-blush-linen",
    label: "Blush Linen Wrap",
    category: "wrap",
    supportsBow: true,
    allowedStemVisibility: ["tucked", "exposed"],
    defaultStemVisibility: "tucked",
    collarY: 705,
    waterlineY: null,
    swatchHex: "#ECD9D4",
    pocketMaskPolygon: [
      [330, 680],
      [670, 680],
      [585, 1085],
      [415, 1085],
    ],
  },
  "wrap-natural-kraft": {
    vesselId: "wrap-natural-kraft",
    label: "Kraft Paper Wrap",
    category: "wrap",
    supportsBow: true,
    allowedStemVisibility: ["tucked", "exposed"],
    defaultStemVisibility: "tucked",
    collarY: 705,
    waterlineY: null,
    swatchHex: "#CBB08D",
    pocketMaskPolygon: [
      [330, 680],
      [670, 680],
      [585, 1085],
      [415, 1085],
    ],
  },
  "wrap-textured-weave": {
    vesselId: "wrap-textured-weave",
    label: "Premium Textured Wrap",
    category: "wrap",
    supportsBow: true,
    allowedStemVisibility: ["tucked", "exposed"],
    defaultStemVisibility: "tucked",
    collarY: 705,
    waterlineY: null,
    swatchHex: "#DFD7C8",
    pocketMaskPolygon: [
      [330, 680],
      [670, 680],
      [585, 1085],
      [415, 1085],
    ],
  },
  "wrap-transparent-cellophane": {
    vesselId: "wrap-transparent-cellophane",
    label: "Transparent Cellophane",
    category: "wrap",
    supportsBow: true,
    allowedStemVisibility: ["exposed", "tucked"],
    defaultStemVisibility: "exposed",
    collarY: 705,
    waterlineY: null,
    swatchHex: "#E8F2F2",
    pocketMaskPolygon: [
      [330, 680],
      [670, 680],
      [585, 1085],
      [415, 1085],
    ],
  },
  "wrap-floral-patterned": {
    vesselId: "wrap-floral-patterned",
    label: "Floral Patterned Wrap",
    category: "wrap",
    supportsBow: true,
    allowedStemVisibility: ["tucked", "exposed"],
    defaultStemVisibility: "tucked",
    collarY: 705,
    waterlineY: null,
    swatchHex: "#EFE2D6",
    pocketMaskPolygon: [
      [330, 680],
      [670, 680],
      [585, 1085],
      [415, 1085],
    ],
  },
  "wrap-sage-cotton": {
    vesselId: "wrap-sage-cotton",
    label: "Sage Cotton Wrap",
    category: "wrap",
    supportsBow: true,
    allowedStemVisibility: ["tucked", "exposed"],
    defaultStemVisibility: "tucked",
    collarY: 705,
    waterlineY: null,
    swatchHex: "#BAC8BA",
    pocketMaskPolygon: [
      [330, 680],
      [670, 680],
      [585, 1085],
      [415, 1085],
    ],
  },
  "wrap-midnight-charcoal": {
    vesselId: "wrap-midnight-charcoal",
    label: "Midnight Charcoal Wrap",
    category: "wrap",
    supportsBow: true,
    allowedStemVisibility: ["tucked", "exposed"],
    defaultStemVisibility: "tucked",
    collarY: 705,
    waterlineY: null,
    swatchHex: "#303531",
    pocketMaskPolygon: [
      [330, 680],
      [670, 680],
      [585, 1085],
      [415, 1085],
    ],
  },
  "wrap-ivory-parchment": {
    vesselId: "wrap-ivory-parchment",
    label: "Ivory Parchment Wrap",
    category: "wrap",
    supportsBow: true,
    allowedStemVisibility: ["tucked", "exposed"],
    defaultStemVisibility: "tucked",
    collarY: 705,
    waterlineY: null,
    swatchHex: "#F4EFE4",
    pocketMaskPolygon: [
      [330, 680],
      [670, 680],
      [585, 1085],
      [415, 1085],
    ],
  },
  "vase-clear-glass": {
    vesselId: "vase-clear-glass",
    label: "Clear Glass Vase",
    category: "vase",
    supportsBow: false,
    allowedStemVisibility: ["submerged"],
    defaultStemVisibility: "submerged",
    collarY: 690,
    waterlineY: 770,
    swatchHex: "#DCE7E4",
    pocketMaskPolygon: [
      [395, 700],
      [605, 700],
      [632, 910],
      [606, 1080],
      [394, 1080],
      [368, 910],
    ],
  },
  "vase-cream-ceramic": {
    vesselId: "vase-cream-ceramic",
    label: "Matte Cream Ceramic",
    category: "vase",
    supportsBow: false,
    allowedStemVisibility: ["tucked"],
    defaultStemVisibility: "tucked",
    collarY: 695,
    waterlineY: null,
    swatchHex: "#EDE7DC",
    pocketMaskPolygon: [
      [392, 700],
      [608, 700],
      [636, 920],
      [598, 1080],
      [402, 1080],
      [364, 920],
    ],
  },
  "vase-warm-terracotta": {
    vesselId: "vase-warm-terracotta",
    label: "Warm Terracotta Vase",
    category: "vase",
    supportsBow: false,
    allowedStemVisibility: ["tucked"],
    defaultStemVisibility: "tucked",
    collarY: 695,
    waterlineY: null,
    swatchHex: "#C78367",
    pocketMaskPolygon: [
      [392, 700],
      [608, 700],
      [636, 920],
      [598, 1080],
      [402, 1080],
      [364, 920],
    ],
  },
  "bare-stems": {
    vesselId: "bare-stems",
    label: "Bare Hand-Tied Stems",
    category: "minimal",
    supportsBow: true,
    allowedStemVisibility: ["exposed"],
    defaultStemVisibility: "exposed",
    collarY: 740,
    waterlineY: null,
    swatchHex: "#6D8362",
    pocketMaskPolygon: [
      [440, 725],
      [560, 725],
      [555, 770],
      [445, 770],
    ],
  },
};

export const UI_COPY = {
  shareStaleMessage: "Bouquet updated — Generate Updated Link",
  maxStemsReached: "Maximum 18 stems reached — remove or swap a stem to add another.",
  minimalistTip: "Minimalist shines cleanly with 1–5 stems (all current stems preserved).",
  minStemsWarning: "Add at least 3 stems for a balanced bouquet, or switch to Minimalist style.",
  cardOverflowWarning: "Shorten note slightly so your signature fits cleanly on the 4:5 card.",
} as const;
