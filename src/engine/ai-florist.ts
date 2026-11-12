import { arrangeBouquetByPreset } from "./arranger";
import { OCCASION_TEMPLATES } from "./occasions";
import {
  BotanicalMeta,
  BouquetSceneV1,
  BowStyleId,
  COMPOSITION_PRESET_IDS,
  ColorFamily,
  CompositionPresetId,
  MAX_STEMS_GLOBAL,
  OccasionSlug,
  RIBBON_COLOR_IDS,
  RIBBON_FINISH_IDS,
  RibbonColorId,
  RibbonFinishId,
  StemInstance,
  VesselId,
} from "./types";
import { normalizePresentationConfig, sanitizeTextInput } from "./validation";

export type AiBouquetProposal = {
  id: string;
  title: string;
  subtitle: string;
  rationale: string;
  paletteLabel: string;
  paletteSwatches: string[];
  styleSummary: string;
  occasionTag: OccasionSlug;
  stemNames: string[];
  scene: BouquetSceneV1;
  source: "atelier-engine" | "ai-enhanced";
};

const OCCASION_KEYWORDS: ReadonlyArray<{ occasion: OccasionSlug; words: readonly string[] }> = [
  { occasion: "birthday", words: ["birthday", "bday", "celebrat", "turned", "cheerful"] },
  { occasion: "anniversary", words: ["anniversary", "years together", "milestone", "our day"] },
  { occasion: "valentines-day", words: ["valentine", "crush", "sweetheart", "passionate", "be mine"] },
  { occasion: "wedding", words: ["wedding", "bride", "bridal", "vow", "ceremony", "marry", "engagement"] },
  { occasion: "thank-you", words: ["thank", "grateful", "gratitude", "appreciate", "kindness"] },
  { occasion: "congratulations", words: ["congrat", "graduat", "promo", "new job", "proud", "baby", "housewarming"] },
  { occasion: "get-well", words: ["get well", "recover", "healing", "feel better", "hospital", "rest"] },
  { occasion: "apology", words: ["sorry", "apolog", "forgive", "make it right", "regret"] },
  { occasion: "friendship", words: ["friend", "bestie", "bff", "pal", "galentine", "sister"] },
  { occasion: "mothers-day", words: ["mother", "mom", "mum", "mama", "grandma", "nurtur"] },
  { occasion: "just-because", words: ["just because", "thinking of you", "no reason", "surprise"] },
  { occasion: "sympathy", words: ["sympathy", "condolence", "loss", "memorial", "peace"] },
  { occasion: "romance", words: ["romance", "romantic", "love", "date night", "adore"] },
  { occasion: "miss-you", words: ["miss you", "distance", "far away", "across miles"] },
];

const COLOR_CUE_MAP: ReadonlyArray<{
  colors: readonly ColorFamily[];
  words: readonly string[];
  label: string;
}> = [
  { colors: ["blush", "ivory"], words: ["blush", "pink", "pastel", "soft", "sweet", "romantic"], label: "Soft Blush & Ivory" },
  { colors: ["crimson", "amber"], words: ["crimson", "red", "ruby", "deep", "passion", "dramatic", "velvet"], label: "Velvet Crimson & Claret" },
  { colors: ["amber", "ivory"], words: ["yellow", "gold", "sun", "sunny", "sunlit", "bright", "peach", "cheerful", "warm"], label: "Sunlit Marigold & Peach" },
  { colors: ["lavender"], words: ["lavender", "purple", "lilac", "violet", "calm", "sleep", "serene"], label: "Twilight Lavender & Mist" },
  { colors: ["ivory", "sage"], words: ["white", "ivory", "pure", "bridal", "clean", "minimal", "snow"], label: "Pure Ivory & Porcelain" },
  { colors: ["sage"], words: ["green", "tropical", "monstera", "botanical", "forest", "leafy", "earthy"], label: "Lush Emerald & Botanical Green" },
];

const STYLE_CUE_MAP: ReadonlyArray<{ preset: CompositionPresetId; words: readonly string[] }> = [
  { preset: "minimalist", words: ["minimal", "minimalist", "clean", "simple", "modern", "sleek"] },
  { preset: "luxury", words: ["luxury", "luxe", "grand", "opulent", "dramatic", "editorial", "sculptural", "monstera"] },
  { preset: "garden", words: ["garden", "organic", "loose", "airy"] },
  { preset: "wildflower", words: ["wild", "wildflower", "meadow"] },
  { preset: "romantic", words: ["romantic", "dreamy", "flowing", "poetic", "soft"] },
  { preset: "hand-tied", words: ["hand-tied", "rustic", "farmhouse", "kraft", "natural"] },
  { preset: "round", words: ["round", "classic", "dome", "traditional", "balanced"] },
];

function detectOccasionFromPrompt(promptLower: string, explicitOccasion?: OccasionSlug | ""): OccasionSlug {
  if (explicitOccasion && explicitOccasion in OCCASION_TEMPLATES) {
    return explicitOccasion;
  }
  for (const item of OCCASION_KEYWORDS) {
    if (item.words.some((w) => promptLower.includes(w))) {
      return item.occasion;
    }
  }
  return "just-because";
}

function detectPreferredColors(promptLower: string): ColorFamily[] {
  const matched: ColorFamily[] = [];
  for (const entry of COLOR_CUE_MAP) {
    if (entry.words.some((w) => promptLower.includes(w))) {
      for (const c of entry.colors) {
        if (!matched.includes(c)) matched.push(c);
      }
    }
  }
  return matched;
}

function detectPreset(promptLower: string, preferred?: CompositionPresetId | "", fallback: CompositionPresetId = "garden"): CompositionPresetId {
  if (preferred && COMPOSITION_PRESET_IDS.includes(preferred)) {
    return preferred;
  }
  for (const item of STYLE_CUE_MAP) {
    if (item.words.some((w) => promptLower.includes(w))) {
      return item.preset;
    }
  }
  return fallback;
}

function pickSkusByPrompt(
  promptLower: string,
  preferredColors: readonly ColorFamily[],
  occasion: OccasionSlug,
  metaMap: ReadonlyMap<string, BotanicalMeta>,
  targetCount: number,
  seedOffset: number,
): string[] {
  const all = Array.from(metaMap.values());
  const tpl = OCCASION_TEMPLATES[occasion];

  const explicitlyMentioned = all
    .filter((m) => {
      const nameParts = m.name.toLowerCase().split(/\s+/);
      const fam = m.familyId.toLowerCase();
      return promptLower.includes(fam) || nameParts.some((p) => p.length > 4 && promptLower.includes(p));
    })
    .map((m) => m.skuId);

  const scored = all
    .map((m, idx) => {
      let score = 0;
      if (explicitlyMentioned.includes(m.skuId)) score += 6;
      if (preferredColors.includes(m.colorFamily)) score += 4;
      if (m.occasionTags.includes(occasion)) score += 3;
      if (tpl.recommendedSkuIds.includes(m.skuId)) score += 2.5;
      // Rotate tie-breaker subtly across the 3 proposals so each option feels distinct
      score += ((idx + seedOffset * 5) % 7) * 0.18;
      return { meta: m, score };
    })
    .sort((a, b) => b.score - a.score);

  const foliage = scored.filter((s) => s.meta.role === "foliage").slice(0, 2);
  const fillers = scored.filter((s) => s.meta.role === "filler").slice(0, 2);
  const focals = scored.filter((s) => s.meta.role === "focal").slice(0, Math.max(2, targetCount - 4));

  const combined: string[] = [];
  for (const item of [...foliage, ...focals, ...fillers]) {
    if (!combined.includes(item.meta.skuId)) {
      combined.push(item.meta.skuId);
    }
    if (combined.length >= Math.min(targetCount, MAX_STEMS_GLOBAL)) break;
  }

  // Ensure minimum 6 stems unless minimalist asks for fewer
  for (const fallback of tpl.recommendedSkuIds) {
    if (combined.length >= targetCount) break;
    if (metaMap.has(fallback) && !combined.includes(fallback)) {
      combined.push(fallback);
    }
  }

  return combined;
}

function buildProposalScene(params: {
  idPrefix: string;
  skuIds: readonly string[];
  preset: CompositionPresetId;
  vesselId: VesselId;
  ribbonFinishId: RibbonFinishId;
  ribbonColorId: RibbonColorId;
  bowStyleId: BowStyleId;
  occasion: OccasionSlug;
  message: string;
  currentScene?: BouquetSceneV1;
  metaMap: ReadonlyMap<string, BotanicalMeta>;
}): BouquetSceneV1 {
  const tpl = OCCASION_TEMPLATES[params.occasion];
  const rawStems: StemInstance[] = params.skuIds
    .filter((id) => params.metaMap.has(id))
    .map((skuId, idx) => ({
      id: `ai-${params.idPrefix}-${Date.now().toString(36)}-${idx}`,
      skuId,
      x: 500,
      y: 420,
      scale: 1,
      rotationDeg: 0,
      flippedX: false,
      zIndex: idx,
      locked: false,
    }));

  const arranged = arrangeBouquetByPreset(rawStems, params.preset, params.metaMap);

  return {
    schemaVersion: 1,
    stems: arranged,
    occasionTag: params.occasion,
    presentation: normalizePresentationConfig({
      vesselId: params.vesselId,
      bowStyleId: params.bowStyleId,
      ribbonFinishId: params.ribbonFinishId,
      ribbonColorId: params.ribbonColorId,
      stemVisibility: params.currentScene?.presentation.stemVisibility ?? "tucked",
      tableSurfaceId: tpl.tableSurfaceId,
      compositionPreset: params.preset,
    }),
    card: {
      templateId: tpl.cardTemplateId,
      envelopeId: tpl.cardTemplateId,
      waxSealColorId: tpl.waxSealColorId,
      fontPairingId: tpl.fontPairingId,
      textAlign: params.currentScene?.card.textAlign ?? "left",
      paperTintId: tpl.paperTintId,
      textColorId: tpl.textColorId,
      enableAnimatedReveal: params.currentScene?.card.enableAnimatedReveal ?? true,
      showPressedPetalWatermark: true,
      recipientName: params.currentScene?.card.recipientName ?? "",
      senderName: params.currentScene?.card.senderName ?? "",
      message: params.message,
      isVisualOnly: false,
      audioTrackId: params.currentScene?.card.audioTrackId ?? "warm-piano",
    },
    showColophon: true,
    hideNamesInPreview: params.currentScene?.hideNamesInPreview ?? false,
    photos: params.currentScene?.photos,
    voiceMessage: params.currentScene?.voiceMessage,
  };
}

export function generateAiBouquetProposals(options: {
  prompt: string;
  occasion?: OccasionSlug | "";
  preferredStyle?: CompositionPresetId | "";
  currentScene?: BouquetSceneV1;
  metaMap: ReadonlyMap<string, BotanicalMeta>;
}): AiBouquetProposal[] {
  const cleanPrompt = sanitizeTextInput(options.prompt || "", 400, 1000);
  const promptLower = cleanPrompt.toLowerCase();
  const occasion = detectOccasionFromPrompt(promptLower, options.occasion);
  const tpl = OCCASION_TEMPLATES[occasion];
  const preferredColors = detectPreferredColors(promptLower);
  const primaryPreset = detectPreset(promptLower, options.preferredStyle, tpl.compositionPreset);

  const primarySkus = pickSkusByPrompt(
    promptLower,
    preferredColors,
    occasion,
    options.metaMap,
    primaryPreset === "minimalist" ? 5 : 8,
    0,
  );

  // Proposal 1: Tailored Primary Composition
  const scene1 = buildProposalScene({
    idPrefix: "sig",
    skuIds: primarySkus,
    preset: primaryPreset,
    vesselId: tpl.vesselId,
    ribbonFinishId: tpl.ribbonFinishId,
    ribbonColorId: tpl.ribbonColorId,
    bowStyleId: tpl.bowStyleId,
    occasion,
    message: tpl.sampleMessage,
    currentScene: options.currentScene,
    metaMap: options.metaMap,
  });

  const primaryNames = primarySkus
    .map((id) => options.metaMap.get(id)?.name ?? id)
    .slice(0, 6);

  const proposal1: AiBouquetProposal = {
    id: "proposal-signature",
    title: `${tpl.label} Signature Pairing`,
    subtitle: `${primaryPreset} silhouette • ${tpl.ribbonFinishId} ribbon`,
    rationale: cleanPrompt
      ? `Tailored around "${cleanPrompt.slice(0, 72)}${cleanPrompt.length > 72 ? "…" : ""}" with balanced focal blooms and layered foliage.`
      : tpl.tagline,
    paletteLabel: tpl.paletteLabel,
    paletteSwatches: [...tpl.paletteSwatches],
    styleSummary: `${primaryPreset} • ${tpl.vesselId.replace("wrap-", "").replace(/-/g, " ")}`,
    occasionTag: occasion,
    stemNames: primaryNames,
    scene: scene1,
    source: "atelier-engine",
  };

  // Proposal 2: Editorial & Textured Modern Alternative
  const editorialPreset: CompositionPresetId =
    primaryPreset === "luxury" ? "minimalist" : "luxury";
  const editorialSkus = pickSkusByPrompt(
    `${promptLower} monstera orchid anemone eucalyptus`,
    preferredColors.length > 0 ? preferredColors : ["ivory", "crimson"],
    occasion,
    options.metaMap,
    7,
    2,
  );
  const editorialVessel: VesselId =
    tpl.vesselId === "wrap-transparent-cellophane"
      ? "wrap-textured-weave"
      : "wrap-transparent-cellophane";
  const scene2 = buildProposalScene({
    idPrefix: "mod",
    skuIds: editorialSkus,
    preset: editorialPreset,
    vesselId: editorialVessel,
    ribbonFinishId: "silk",
    ribbonColorId: "sage-satin",
    bowStyleId: "silk-tails",
    occasion,
    message: tpl.sampleMessage,
    currentScene: options.currentScene,
    metaMap: options.metaMap,
  });

  const proposal2: AiBouquetProposal = {
    id: "proposal-editorial",
    title: "Modern Editorial Silhouette",
    subtitle: `${editorialPreset} line • silk ribbon & crystal cellophane`,
    rationale:
      "Clean sculptural stems anchored by crisp greenery and silk long tails for a contemporary gallery feel.",
    paletteLabel: preferredColors.includes("crimson") ? "Crimson & Sculpted Jade" : "Gallery Ivory & Foliage",
    paletteSwatches: editorialSkus
      .slice(0, 4)
      .map((id) => options.metaMap.get(id)?.colorHex ?? "#E8A9AE"),
    styleSummary: `${editorialPreset} • ${editorialVessel.replace("wrap-", "").replace(/-/g, " ")}`,
    occasionTag: occasion,
    stemNames: editorialSkus.map((id) => options.metaMap.get(id)?.name ?? id).slice(0, 6),
    scene: scene2,
    source: "atelier-engine",
  };

  // Proposal 3: Romantic Garden Keepsake Alternative
  const romanticPreset: CompositionPresetId =
    primaryPreset === "romantic" ? "hand-tied" : "romantic";
  const romanticSkus = pickSkusByPrompt(
    `${promptLower} peony blush ranunculus babys-breath sweet-pea`,
    ["blush", "amber", "ivory"],
    occasion,
    options.metaMap,
    9,
    4,
  );
  const scene3 = buildProposalScene({
    idPrefix: "gar",
    skuIds: romanticSkus,
    preset: romanticPreset,
    vesselId: "wrap-floral-patterned",
    ribbonFinishId: "velvet",
    ribbonColorId: "dusty-rose",
    bowStyleId: "double-bow",
    occasion,
    message: tpl.sampleMessage,
    currentScene: options.currentScene,
    metaMap: options.metaMap,
  });

  const proposal3: AiBouquetProposal = {
    id: "proposal-garden",
    title: "Pressed Botanical Keepsake",
    subtitle: `${romanticPreset} garden • floral paper & dusty-rose velvet`,
    rationale:
      "Airy layered garden blooms wrapped in patterned botanical paper with a soft velvet bow.",
    paletteLabel: "Porcelain Blush & Rosewood",
    paletteSwatches: romanticSkus
      .slice(0, 4)
      .map((id) => options.metaMap.get(id)?.colorHex ?? "#F0BAC1"),
    styleSummary: `${romanticPreset} • floral patterned wrap`,
    occasionTag: occasion,
    stemNames: romanticSkus.map((id) => options.metaMap.get(id)?.name ?? id).slice(0, 6),
    scene: scene3,
    source: "atelier-engine",
  };

  return [proposal1, proposal2, proposal3];
}

/**
 * Optional LLM enhancement when GEMINI_API_KEY is configured on the server.
 * Always falls back cleanly and validates every SKU against allowedSkuIds.
 */
export async function generateAiProposalsWithOptionalLlm(options: {
  prompt: string;
  occasion?: OccasionSlug | "";
  preferredStyle?: CompositionPresetId | "";
  currentScene?: BouquetSceneV1;
  metaMap: ReadonlyMap<string, BotanicalMeta>;
}): Promise<AiBouquetProposal[]> {
  const baseProposals = generateAiBouquetProposals(options);
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (!geminiKey || !options.prompt.trim()) {
    return baseProposals;
  }

  try {
    const skuCatalogList = Array.from(options.metaMap.values())
      .map((m) => `${m.skuId} (${m.name}, ${m.role}, ${m.colorFamily})`)
      .join("; ");

    const systemPrompt = `You are a master luxury digital florist. Given a customer request, refine the first bouquet suggestion using ONLY valid SKU ids from: [${skuCatalogList}]. Respond strictly with JSON: {"title":"...","rationale":"...","message":"...","skuIds":["..."],"preset":"${COMPOSITION_PRESET_IDS.join("|")}","ribbonFinishId":"satin|silk|velvet|twine","ribbonColorId":"${RIBBON_COLOR_IDS.join("|")}"}. Pick 6 to 10 SKUs mixing greenery, focal blooms, and fillers.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(geminiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nCustomer request: ${options.prompt}` }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.65,
          },
        }),
      },
    );
    clearTimeout(timeout);
    if (!res.ok) return baseProposals;

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return baseProposals;

    const parsed = JSON.parse(rawText) as {
      title?: string;
      rationale?: string;
      message?: string;
      skuIds?: unknown;
      preset?: string;
      ribbonFinishId?: string;
      ribbonColorId?: string;
    };

    const validSkus = Array.isArray(parsed.skuIds)
      ? parsed.skuIds.filter((s): s is string => typeof s === "string" && options.metaMap.has(s)).slice(0, 10)
      : [];

    if (validSkus.length < 4) return baseProposals;

    const baseFirst = baseProposals[0]!;
    const preset: CompositionPresetId = COMPOSITION_PRESET_IDS.includes(
      parsed.preset as CompositionPresetId,
    )
      ? (parsed.preset as CompositionPresetId)
      : baseFirst.scene.presentation.compositionPreset;
    const ribbonFinishId: RibbonFinishId = RIBBON_FINISH_IDS.includes(
      parsed.ribbonFinishId as RibbonFinishId,
    )
      ? (parsed.ribbonFinishId as RibbonFinishId)
      : (baseFirst.scene.presentation.ribbonFinishId ?? "silk");
    const ribbonColorId: RibbonColorId = RIBBON_COLOR_IDS.includes(
      parsed.ribbonColorId as RibbonColorId,
    )
      ? (parsed.ribbonColorId as RibbonColorId)
      : baseFirst.scene.presentation.ribbonColorId;

    const enhancedScene = buildProposalScene({
      idPrefix: "ai",
      skuIds: validSkus,
      preset,
      vesselId: baseFirst.scene.presentation.vesselId,
      ribbonFinishId,
      ribbonColorId,
      bowStyleId: baseFirst.scene.presentation.bowStyleId,
      occasion: baseFirst.occasionTag,
      message: parsed.message ? sanitizeTextInput(parsed.message, 600, 1500) : baseFirst.scene.card.message,
      currentScene: options.currentScene,
      metaMap: options.metaMap,
    });

    const enhancedFirst: AiBouquetProposal = {
      ...baseFirst,
      title: parsed.title ? sanitizeTextInput(parsed.title, 60, 120) : baseFirst.title,
      rationale: parsed.rationale ? sanitizeTextInput(parsed.rationale, 200, 400) : baseFirst.rationale,
      stemNames: validSkus.map((id) => options.metaMap.get(id)?.name ?? id).slice(0, 6),
      scene: enhancedScene,
      source: "ai-enhanced",
    };

    return [enhancedFirst, baseProposals[1]!, baseProposals[2]!];
  } catch {
    return baseProposals;
  }
}
