import { BotanicalMeta, BouquetSceneV1, CompositionPresetId } from "./types";

export type ArrangementSuggestionResult = {
  recommendedPreset: CompositionPresetId;
  presetReason: string;
  complementaryStems: Array<{ skuId: string; name: string; reason: string }>;
};

const COMPLEMENTARY_POOL: Array<{
  skuId: string;
  role: "foliage" | "filler" | "focal" | "petal";
  reason: string;
}> = [
  { skuId: "eucalyptus-silver", role: "foliage", reason: "Frames outer silhouette with powdery sage tone" },
  { skuId: "monstera-deliciosa", role: "foliage", reason: "Adds modern sculptural backing behind main blooms" },
  { skuId: "babys-breath", role: "filler", reason: "Softens dense petal clusters with airy white clouds" },
  { skuId: "ruscus-italian", role: "foliage", reason: "Elongates crown height with glossy emerald movement" },
  { skuId: "olive-branch", role: "foliage", reason: "Brings relaxed Mediterranean texture & movement" },
  { skuId: "waxflower", role: "filler", reason: "Tucks blush buds cleanly into perimeter pockets" },
  { skuId: "fern-boston", role: "foliage", reason: "Softens bouquet edges with layered pinnate fronds" },
  { skuId: "rose-petal-blush", role: "petal", reason: "Scatters gentle foreground movement along the cuff" },
];

export function computeArrangementSuggestions(
  scene: BouquetSceneV1,
  metaMap: ReadonlyMap<string, BotanicalMeta>,
): ArrangementSuggestionResult {
  let focals = 0;
  let fillers = 0;
  let foliage = 0;
  const presentSkus = new Set<string>();
  const colorCounts = new Map<string, number>();

  for (const s of scene.stems) {
    presentSkus.add(s.skuId);
    const meta = metaMap.get(s.skuId);
    if (!meta) continue;
    if (meta.role === "focal") focals += 1;
    else if (meta.role === "filler") fillers += 1;
    else if (meta.role === "foliage") foliage += 1;
    colorCounts.set(meta.colorFamily, (colorCounts.get(meta.colorFamily) ?? 0) + 1);
  }

  let recommendedPreset: CompositionPresetId = "hand-tied";
  let presetReason = "Spiral classic stem angle showcases balanced multi-bloom fullness.";

  if (scene.stems.length <= 4) {
    recommendedPreset = "minimalist";
    presetReason = "Generous negative space lets architectural statement stems breathe.";
  } else if (presentSkus.has("orchid-white") || presentSkus.has("dahlia-burgundy") || focals >= 6) {
    recommendedPreset = "luxury";
    presetReason = "Tiered couture elevation frames multi-focal drama and sculptural blooms.";
  } else if (presentSkus.has("lavender") || presentSkus.has("meadow-aster") || fillers >= 2) {
    recommendedPreset = "wildflower";
    presetReason = "Organic height dispersion celebrates airy stems, lavender, and meadow textures.";
  } else if (presentSkus.has("sunflower-front") || presentSkus.has("olive-branch")) {
    recommendedPreset = "garden";
    presetReason = "Loose natural meadow spacing highlights sunflowers, tulips, and garden greens.";
  } else if ((colorCounts.get("blush") ?? 0) >= 2 || presentSkus.has("peony-blush-full")) {
    recommendedPreset = "romantic";
    presetReason = "Soft asymmetric crescent flatters full peonies and garden roses.";
  } else if (focals >= 4) {
    recommendedPreset = "round";
    presetReason = "Symmetric European dome creates an abundant floral center.";
  }

  // Prefer suggestions aligned to what's light in the current arrangement
  const needsFoliage = foliage < 2;
  const needsFiller = fillers < 1;

  const prioritized = COMPLEMENTARY_POOL.filter((item) => !presentSkus.has(item.skuId) && metaMap.has(item.skuId))
    .sort((a, b) => {
      const score = (r: string) =>
        (needsFoliage && r === "foliage" ? -2 : 0) + (needsFiller && r === "filler" ? -1 : 0);
      return score(a.role) - score(b.role);
    })
    .slice(0, 3)
    .map((item) => ({
      skuId: item.skuId,
      name: metaMap.get(item.skuId)?.name ?? item.skuId,
      reason: item.reason,
    }));

  return {
    recommendedPreset,
    presetReason,
    complementaryStems: prioritized,
  };
}

