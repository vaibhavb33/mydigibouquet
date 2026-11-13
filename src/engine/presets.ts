import { arrangeBouquetByPreset } from "./arranger";
import {
  BotanicalMeta,
  BouquetSceneV1,
  CompositionPresetId,
  OccasionSlug,
  PresentationConfig,
  StemInstance,
} from "./types";

export type BouquetPresetDefinition = {
  id: string;
  title: string;
  subtitle: string;
  occasion: OccasionSlug;
  compositionPreset: CompositionPresetId;
  skuIds: readonly string[];
  presentation: PresentationConfig;
  defaultNote: string;
};

export const COMPOSITION_PRESET_LABELS: Record<
  CompositionPresetId,
  { label: string; description: string }
> = {
  round: {
    label: "Classic Round",
    description: "Balanced European dome with hero focals nested at the crown",
  },
  "hand-tied": {
    label: "European Hand-Tied",
    description: "Spiral stem clutch with collared ruscus & radial flare",
  },
  romantic: {
    label: "Garden Romance",
    description: "Soft asymmetric sweep of garden roses, peonies & cupped petals",
  },
  garden: {
    label: "Garden-Style",
    description: "Airy organic meadow height with breathing space & sprigs",
  },
  luxury: {
    label: "Luxury Rose Bouquet",
    description: "Architectural high-drama tiered heirloom roses framed by silk tails",
  },
  minimalist: {
    label: "Modern Minimalist",
    description: "Sculptural negative-space stem line for statement blooms",
  },
  wildflower: {
    label: "Wildflower Garden",
    description: "Airy polychromatic meadow halo with lavender, chamomile & sprigs",
  },
  "spring-pastel": {
    label: "Spring Pastel",
    description: "Cupped pastel tulips, blush peonies, ranunculus & eucalyptus",
  },
  sunset: {
    label: "Sunset Bouquet",
    description: "Warm golden sunflowers, amber zinnias, apricot roses & autumn oak",
  },
  monochrome: {
    label: "Elegant Monochrome",
    description: "Pure ivory porcelain camellias, white lilies, orchids & baby's breath",
  },
  "peony-deluxe": {
    label: "Premium Peony Arrangement",
    description: "Lush coral and blush ruffled peony crowns with salal & pine",
  },
};

export const STARTER_BOUQUETS: readonly BouquetPresetDefinition[] = [
  {
    id: "classic-romance",
    title: "Classic Romance",
    subtitle: "Garden roses, blush peonies & airy baby's breath",
    occasion: "romance",
    compositionPreset: "romantic",
    skuIds: [
      "eucalyptus-silver",
      "pine-sprig",
      "eucalyptus-seeded",
      "peony-blush-full",
      "rose-blush-open",
      "rose-crimson-open",
      "peony-coral-full",
      "ranunculus-peach",
      "rose-blush-half",
      "peony-blush-small",
      "babys-breath",
      "babys-breath",
    ],
    presentation: {
      vesselId: "wrap-blush-linen",
      bowStyleId: "silk-tails",
      ribbonFinishId: "velvet",
      ribbonColorId: "velvet-burgundy",
      stemVisibility: "tucked",
      tableSurfaceId: "linen",
      compositionPreset: "romantic",
    },
    defaultNote:
      "Every stem in this bouquet was chosen slowly with you in mind—thank you for bringing warmth into every quiet corner of my week.",
  },
  {
    id: "sunlit-birthday",
    title: "Sunlit Birthday",
    subtitle: "Radiant sunflowers, blush tulips, meadow aster & chamomile",
    occasion: "birthday",
    compositionPreset: "garden",
    skuIds: [
      "olive-branch",
      "eucalyptus-silver",
      "sunflower-front",
      "sunflower-angled",
      "tulip-yellow-tilted",
      "tulip-blush-upright",
      "ranunculus-peach",
      "peony-coral-full",
      "daisy-chamomile",
      "meadow-aster",
      "babys-breath",
    ],
    presentation: {
      vesselId: "wrap-natural-kraft",
      bowStyleId: "double-bow",
      ribbonFinishId: "twine",
      ribbonColorId: "natural-twine",
      stemVisibility: "tucked",
      tableSurfaceId: "limewash",
      compositionPreset: "garden",
    },
    defaultNote:
      "Wishing you a year full of unhurried mornings, bright kitchens, and every small joy you keep wishing for everyone else.",
  },
  {
    id: "quiet-apology",
    title: "Quiet Apology",
    subtitle: "Ivory garden roses, blue hydrangea, chamomile & olive twigs",
    occasion: "apology",
    compositionPreset: "hand-tied",
    skuIds: [
      "olive-branch",
      "eucalyptus-seeded",
      "eucalyptus-silver",
      "rose-white-open",
      "hydrangea-blue",
      "peony-blush-small",
      "rose-blush-open",
      "tulip-blush-upright",
      "daisy-chamomile",
      "babys-breath",
      "babys-breath",
    ],
    presentation: {
      vesselId: "wrap-ivory-parchment",
      bowStyleId: "minimal-knot",
      ribbonFinishId: "silk",
      ribbonColorId: "sage-satin",
      stemVisibility: "tucked",
      tableSurfaceId: "travertine",
      compositionPreset: "hand-tied",
    },
    defaultNote:
      "I’m truly sorry for how I handled things earlier. Take all the space you need—I value you far more than getting the last word.",
  },
  {
    id: "evening-velvet-luxury",
    title: "Midnight Couture",
    subtitle: "Crimson roses, coral peonies, pine & silk drape",
    occasion: "anniversary",
    compositionPreset: "luxury",
    skuIds: [
      "pine-sprig",
      "eucalyptus-seeded",
      "ruscus-italian",
      "rose-crimson-open",
      "peony-blush-full",
      "peony-coral-full",
      "rose-crimson-open",
      "tulip-red-upright",
      "ranunculus-peach",
      "rose-blush-half",
      "babys-breath",
    ],
    presentation: {
      vesselId: "wrap-midnight-charcoal",
      bowStyleId: "wax-band",
      ribbonFinishId: "velvet",
      ribbonColorId: "champagne-gold",
      stemVisibility: "tucked",
      tableSurfaceId: "slate",
      compositionPreset: "luxury",
    },
    defaultNote:
      "Another year beside you still feels like the best chapter I have ever walked into. Happy anniversary, my favorite person.",
  },
  {
    id: "grateful-glass",
    title: "Morning Table Vase",
    subtitle: "Sky hydrangeas, peach ranunculus, tulips & meadow blooms in glass",
    occasion: "thank-you",
    compositionPreset: "wildflower",
    skuIds: [
      "eucalyptus-silver",
      "pine-sprig",
      "hydrangea-blue",
      "ranunculus-peach",
      "tulip-blush-upright",
      "rose-peach-open",
      "meadow-aster",
      "daisy-chamomile",
      "babys-breath",
      "peony-blush-small",
    ],
    presentation: {
      vesselId: "vase-clear-glass",
      bowStyleId: "none",
      ribbonColorId: "silk-cream",
      stemVisibility: "submerged",
      tableSurfaceId: "linen",
      compositionPreset: "wildflower",
    },
    defaultNote:
      "Thank you for showing up without being asked and making a heavy week feel effortless. Fresh blooms for your desk.",
  },
  {
    id: "sculptural-minimalist",
    title: "Pure Orchid Minimalist",
    subtitle: "White orchid, bud rose & single silver eucalyptus",
    occasion: "sympathy",
    compositionPreset: "minimalist",
    skuIds: ["eucalyptus-silver", "orchid-white", "rose-white-open", "tulip-blush-upright"],
    presentation: {
      vesselId: "vase-cream-ceramic",
      bowStyleId: "none",
      ribbonColorId: "silk-cream",
      stemVisibility: "tucked",
      tableSurfaceId: "limewash",
      compositionPreset: "minimalist",
    },
    defaultNote:
      "Holding you closely in my thoughts during this tender season. No reply needed—just warmth sent quietly to your table.",
  },
  {
    id: "miss-you-round",
    title: "Warm Dome Miss You",
    subtitle: "Coral peonies, blush roses & airy chamomile clouds",
    occasion: "miss-you",
    compositionPreset: "round",
    skuIds: [
      "eucalyptus-silver",
      "olive-branch",
      "peony-coral-full",
      "rose-blush-open",
      "peony-blush-small",
      "rose-blush-half",
      "tulip-red-tilted",
      "ranunculus-peach",
      "daisy-chamomile",
      "babys-breath",
    ],
    presentation: {
      vesselId: "wrap-sage-cotton",
      bowStyleId: "double-bow",
      ribbonFinishId: "satin",
      ribbonColorId: "dusty-rose",
      stemVisibility: "tucked",
      tableSurfaceId: "linen",
      compositionPreset: "round",
    },
    defaultNote:
      "Time zones are loud lately, so here are fresh blooms to bridge the distance until our coffee cups meet on the same table.",
  },
  {
    id: "get-well-sunshine",
    title: "Sunlit Recovery",
    subtitle: "Tilted tulips, peach ranunculus, hydrangea & olive foliage",
    occasion: "get-well",
    compositionPreset: "garden",
    skuIds: [
      "olive-branch",
      "pine-sprig",
      "tulip-yellow-tilted",
      "tulip-red-tilted",
      "ranunculus-peach",
      "hydrangea-blue",
      "rose-peach-open",
      "daisy-chamomile",
      "babys-breath",
    ],
    presentation: {
      vesselId: "vase-warm-terracotta",
      bowStyleId: "none",
      ribbonColorId: "silk-cream",
      stemVisibility: "tucked",
      tableSurfaceId: "travertine",
      compositionPreset: "garden",
    },
    defaultNote:
      "Rest deeply, sip tea slowly, and take all the gentle hours you need to heal.",
  },
  {
    id: "spring-pastel-meadow",
    title: "Spring Pastel Meadow",
    subtitle: "Cupped pastel tulips, blush peonies, ranunculus & silver eucalyptus",
    occasion: "congratulations",
    compositionPreset: "spring-pastel",
    skuIds: [
      "eucalyptus-silver",
      "pittosporum-variegated",
      "peony-blush-full",
      "tulip-blush-upright",
      "tulip-yellow-tilted",
      "ranunculus-peach",
      "carnation-blush",
      "peony-blush-small",
      "daisy-chamomile",
      "babys-breath",
      "babys-breath",
    ],
    presentation: {
      vesselId: "wrap-blush-linen",
      bowStyleId: "double-bow",
      ribbonFinishId: "satin",
      ribbonColorId: "dusty-rose",
      stemVisibility: "tucked",
      tableSurfaceId: "linen",
      compositionPreset: "spring-pastel",
    },
    defaultNote:
      "So endlessly thrilled for your bright new chapter! Sending gentle spring blooms to celebrate your achievement.",
  },
  {
    id: "sunset-radiance",
    title: "Sunset Bouquet",
    subtitle: "Warm golden sunflowers, amber zinnias, apricot roses & oak foliage",
    occasion: "birthday",
    compositionPreset: "sunset",
    skuIds: [
      "autumn-oak-foliage",
      "eucalyptus-seeded",
      "sunflower-front",
      "sunflower-angled",
      "zinnia-amber",
      "rose-peach-open",
      "ranunculus-peach",
      "daisy-chamomile",
      "babys-breath",
    ],
    presentation: {
      vesselId: "wrap-natural-kraft",
      bowStyleId: "double-bow",
      ribbonFinishId: "twine",
      ribbonColorId: "natural-twine",
      stemVisibility: "tucked",
      tableSurfaceId: "limewash",
      compositionPreset: "sunset",
    },
    defaultNote:
      "May your day be filled with warm sunset light, laughter, and everything that brings you real happiness.",
  },
  {
    id: "elegant-monochrome-ivory",
    title: "Elegant Monochrome",
    subtitle: "Porcelain camellias, white lilies, orchids & baby's breath",
    occasion: "wedding",
    compositionPreset: "monochrome",
    skuIds: [
      "ruscus-italian",
      "olive-branch",
      "magnolia-ivory",
      "camellia-white",
      "orchid-white",
      "rose-white-open",
      "lily-oriental-up",
      "babys-breath",
      "babys-breath",
    ],
    presentation: {
      vesselId: "wrap-ivory-parchment",
      bowStyleId: "silk-tails",
      ribbonFinishId: "silk",
      ribbonColorId: "silk-cream",
      stemVisibility: "tucked",
      tableSurfaceId: "travertine",
      compositionPreset: "monochrome",
    },
    defaultNote:
      "A tribute in pure porcelain white. Celebrating your timeless union and an unforgettable day.",
  },
  {
    id: "peony-deluxe-coral",
    title: "Premium Peony Arrangement",
    subtitle: "Lush coral & blush ruffled peony crowns with salal & pine",
    occasion: "anniversary",
    compositionPreset: "peony-deluxe",
    skuIds: [
      "salal-lemon-leaf",
      "pine-sprig",
      "pittosporum-variegated",
      "peony-coral-full",
      "peony-blush-full",
      "rose-blush-open",
      "peony-blush-small",
      "carnation-blush",
      "babys-breath",
      "babys-breath",
    ],
    presentation: {
      vesselId: "wrap-textured-weave",
      bowStyleId: "double-bow",
      ribbonFinishId: "satin",
      ribbonColorId: "champagne-gold",
      stemVisibility: "tucked",
      tableSurfaceId: "linen",
      compositionPreset: "peony-deluxe",
    },
    defaultNote:
      "Lush summer peonies gathered together to remind you how deeply treasured and loved you are.",
  },
];

export function buildSceneFromPreset(
  preset: BouquetPresetDefinition,
  metaMap: ReadonlyMap<string, BotanicalMeta>,
): BouquetSceneV1 {
  const initialStems: StemInstance[] = preset.skuIds
    .filter((sku) => metaMap.has(sku))
    .map((skuId, idx) => ({
      id: `stem-${preset.id}-${idx + 1}`,
      skuId,
      x: 500,
      y: 420,
      scale: 1,
      rotationDeg: 0,
      flippedX: false,
      zIndex: idx,
      locked: false,
    }));

  const arranged = arrangeBouquetByPreset(initialStems, preset.compositionPreset, metaMap);

  return {
    schemaVersion: 1,
    stems: arranged,
    presentation: preset.presentation,
    card: {
      templateId: preset.occasion === "anniversary" ? "midnight-velvet" : "botanical-cream",
      envelopeId: preset.occasion === "anniversary" ? "midnight-velvet" : "botanical-cream",
      waxSealColorId: preset.occasion === "anniversary" ? "antique-gold" : "terracotta-rose",
      fontPairingId: "editorial-serif",
      textAlign: "left",
      paperTintId: preset.occasion === "anniversary" ? "charcoal" : "natural",
      textColorId: preset.occasion === "anniversary" ? "pearl" : "charcoal",
      enableAnimatedReveal: true,
      showPressedPetalWatermark: true,
      recipientName: "",
      senderName: "",
      message: preset.defaultNote,
      isVisualOnly: false,
      audioTrackId: "warm-piano",
    },
    showColophon: true,
    hideNamesInPreview: false,
    occasionTag: preset.occasion,
  };
}

