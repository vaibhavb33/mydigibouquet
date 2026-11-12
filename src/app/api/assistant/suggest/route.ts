import { NextResponse } from "next/server";
import { generateAiProposalsWithOptionalLlm } from "@/engine/ai-florist";
import { OCCASION_TEMPLATES } from "@/engine/occasions";
import {
  BouquetSceneV1,
  COMPOSITION_PRESET_IDS,
  CompositionPresetId,
  OccasionSlug,
} from "@/engine/types";
import { validateAndNormalizeScene } from "@/engine/validation";
import { ALLOWED_SKU_IDS, CATALOG_META_MAP } from "@/generated/catalog-manifest";
import { assertSameOrigin, checkRateLimit } from "@/lib/request-security";

export async function POST(req: Request) {
  const originErr = assertSameOrigin(req);
  if (originErr) return originErr;

  const rateErr = checkRateLimit(req, { bucket: "assistant-suggest", limit: 25, windowMs: 60_000 });
  if (rateErr) return rateErr;

  try {
    const body = (await req.json()) as {
      prompt?: string;
      occasion?: string;
      preferredStyle?: string;
      currentScene?: unknown;
    };

    const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 400) : "";
    const occasion: OccasionSlug | "" =
      typeof body.occasion === "string" && body.occasion in OCCASION_TEMPLATES
        ? (body.occasion as OccasionSlug)
        : "";
    const preferredStyle: CompositionPresetId | "" =
      typeof body.preferredStyle === "string" &&
      COMPOSITION_PRESET_IDS.includes(body.preferredStyle as CompositionPresetId)
        ? (body.preferredStyle as CompositionPresetId)
        : "";

    let currentScene: BouquetSceneV1 | undefined;
    if (body.currentScene) {
      const validated = validateAndNormalizeScene(body.currentScene, ALLOWED_SKU_IDS);
      if (validated.ok) currentScene = validated.scene;
    }

    const proposals = await generateAiProposalsWithOptionalLlm({
      prompt,
      occasion,
      preferredStyle,
      currentScene,
      metaMap: CATALOG_META_MAP,
    });

    return NextResponse.json({ proposals });
  } catch (error) {
    console.error("POST /api/assistant/suggest error", error);
    return NextResponse.json({ error: "Unable to generate bouquet suggestions" }, { status: 500 });
  }
}

