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
    label: "Round Bouquet",
    description: "Balanced European dome with hero focals nested at the crown",
  },
  "hand-tied": {
    label: "Classic Hand-Tied",
    description: "Spiral stem clutch with collared ruscus & soft radial flare",
  },
  romantic: {
    label: "Romantic",
    description: "Soft asymmetric sweep of garden roses, peonies & cupped petals",
  },
  garden: {
    label: "Garden-Style",
    description: "Airy organic meadow height with breathing space & sprigs",
  },
  luxury: {
    label: "Premium Luxury",
    description: "Architectural high-drama tiered blooms framed by silk tails",
  },
  minimalist: {
    label: "Minimalist",
    description: "Sculptural negative-space stem line for 1–5 statement blooms",
  },
  wildflower: {
    label: "Wildflower",
    description: "Playful polychromatic halo with lavender, chamomile & wispy greens",
  },
};

export const STARTER_BOUQUETS: readonly BouquetPresetDefinition[] = [
  {
    id: "classic-romance",
    title: "Classic Romance",
    subtitle: "Garden roses, blush peonies & seeded eucalyptus",
    occasion: "romance",
    compositionPreset: "romantic",
    skuIds: [
      "eucalyptus-silver",
      "ruscus-italian",
      "peony-blush-full",
      "rose-blush-open",
      "rose-crimson-open",
      "rose-blush-half",
      "peony-blush-small",
      "babys-breath",
      "eucalyptus-seeded",
      "rose-petal-blush",
    ],
    presentation: {
      vesselId: "wrap-blush-linen",
      bowStyleId: "silk-tails",
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
    subtitle: "Radiant sunflowers, yellow tulips & chamomile",
    occasion: "birthday",
    compositionPreset: "garden",
    skuIds: [
      "olive-branch",
      "fern-boston",
      "sunflower-front",
      "sunflower-angled",
      "tulip-yellow-tilted",
      "ranunculus-peach",
      "daisy-chamomile",
      "waxflower",
      "eucalyptus-silver",
    ],
    presentation: {
      vesselId: "wrap-natural-kraft",
      bowStyleId: "double-bow",
      ribbonColorId: "natural-twine",
      stemVisibility: "exposed",
      tableSurfaceId: "limewash",
      compositionPreset: "garden",
    },
    defaultNote:
      "Wishing you a year full of unhurried mornings, bright kitchens, and every small joy you keep wishing for everyone else.",
  },
  {
    id: "quiet-apology",
    title: "Quiet Apology",
    subtitle: "White orchids, chamomile & soft olive branches",
    occasion: "apology",
    compositionPreset: "hand-tied",
    skuIds: [
      "olive-branch",
      "dusty-miller",
      "orchid-white",
      "rose-white-open",
      "anemone-blush",
      "babys-breath",
      "daisy-chamomile",
      "eucalyptus-seeded",
    ],
    presentation: {
      vesselId: "wrap-ivory-parchment",
      bowStyleId: "minimal-knot",
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
    subtitle: "Deep burgundy dahlias, white lilies & crimson roses",
    occasion: "anniversary",
    compositionPreset: "luxury",
    skuIds: [
      "ruscus-italian",
      "pine-sprig",
      "lily-oriental-up",
      "dahlia-burgundy",
      "rose-crimson-open",
      "lily-oriental-angled",
      "peony-coral-full",
      "rose-blush-bud",
      "willow-sprig",
    ],
    presentation: {
      vesselId: "wrap-midnight-charcoal",
      bowStyleId: "wax-band",
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
    subtitle: "Hydrangeas, peach ranunculus & wildflowers in glass",
    occasion: "thank-you",
    compositionPreset: "wildflower",
    skuIds: [
      "eucalyptus-silver",
      "willow-sprig",
      "hydrangea-blue",
      "ranunculus-peach",
      "lavender",
      "meadow-aster",
      "daisy-chamomile",
      "lotus",
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
    subtitle: "Coral peonies, blush roses & lavender sprigs",
    occasion: "miss-you",
    compositionPreset: "round",
    skuIds: [
      "eucalyptus-silver",
      "olive-branch",
      "peony-coral-full",
      "rose-blush-open",
      "rose-blush-half",
      "tulip-red-upright",
      "lavender",
      "waxflower",
    ],
    presentation: {
      vesselId: "wrap-sage-cotton",
      bowStyleId: "double-bow",
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
    subtitle: "Tilted yellow tulips, peach ranunculus & olive",
    occasion: "get-well",
    compositionPreset: "garden",
    skuIds: [
      "olive-branch",
      "fern-boston",
      "tulip-yellow-tilted",
      "tulip-red-tilted",
      "ranunculus-peach",
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

