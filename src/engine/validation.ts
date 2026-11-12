import { z } from "zod";
import {
  AUDIO_TRACK_IDS,
  BOW_STYLE_IDS,
  BouquetSceneV1,
  CANONICAL_OCCASIONS,
  CARD_TEMPLATE_IDS,
  CARD_TEXT_COLOR_IDS,
  COMPOSITION_PRESET_IDS,
  FONT_PAIRING_IDS,
  MAX_STEMS_GLOBAL,
  MIN_STEMS_MINIMALIST,
  MIN_STEMS_STANDARD,
  PAPER_TINT_IDS,
  PresentationConfig,
  RIBBON_COLOR_IDS,
  RIBBON_FINISH_IDS,
  STEM_VISIBILITY_IDS,
  TABLE_SURFACE_IDS,
  VESSEL_IDS,
  VESSEL_RULES,
  WAX_SEAL_COLOR_IDS,
} from "./types";

const CONTROL_AND_BIDI_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g;

export function countGraphemes(input: string): number {
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    const seg = new Intl.Segmenter("en", { granularity: "grapheme" });
    let count = 0;
    for (const _ of seg.segment(input)) {
      count += 1;
    }
    return count;
  }
  return Array.from(input).length;
}

export function sanitizeTextInput(raw: string, maxGraphemes: number, maxUtf8Bytes: number): string {
  const cleaned = raw.replace(CONTROL_AND_BIDI_RE, "").trim();
  let result = cleaned;
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    const seg = new Intl.Segmenter("en", { granularity: "grapheme" });
    const parts: string[] = [];
    for (const s of seg.segment(cleaned)) {
      if (parts.length >= maxGraphemes) break;
      parts.push(s.segment);
    }
    result = parts.join("");
  } else {
    result = Array.from(cleaned).slice(0, maxGraphemes).join("");
  }

  const encoder = new TextEncoder();
  while (encoder.encode(result).byteLength > maxUtf8Bytes && result.length > 0) {
    result = result.slice(0, -1);
  }
  return result;
}

export function normalizePresentationConfig(config: PresentationConfig): PresentationConfig {
  const rule = VESSEL_RULES[config.vesselId];
  const bowStyleId = rule.supportsBow ? config.bowStyleId : "none";
  const stemVisibility = rule.allowedStemVisibility.includes(config.stemVisibility)
    ? config.stemVisibility
    : rule.defaultStemVisibility;

  return {
    ...config,
    bowStyleId,
    ribbonFinishId: config.ribbonFinishId ?? "satin",
    stemVisibility,
  };
}

export const StemInstanceSchema = z.object({
  id: z.string().min(4).max(64),
  skuId: z.string().min(2).max(64),
  x: z.number().min(120).max(880),
  y: z.number().min(90).max(860),
  scale: z.number().min(0.6).max(1.5),
  rotationDeg: z.number().min(-180).max(180),
  flippedX: z.boolean(),
  zIndex: z.number().int().min(0).max(MAX_STEMS_GLOBAL - 1),
  locked: z.boolean().optional().default(false),
});

export const PresentationConfigSchema = z.object({
  vesselId: z.enum(VESSEL_IDS),
  bowStyleId: z.enum(BOW_STYLE_IDS),
  ribbonFinishId: z.enum(RIBBON_FINISH_IDS).optional(),
  ribbonColorId: z.enum(RIBBON_COLOR_IDS),
  stemVisibility: z.enum(STEM_VISIBILITY_IDS),
  tableSurfaceId: z.enum(TABLE_SURFACE_IDS),
  compositionPreset: z.enum(COMPOSITION_PRESET_IDS),
});

export const CardConfigSchema = z.object({
  templateId: z.enum(CARD_TEMPLATE_IDS),
  envelopeId: z.enum(CARD_TEMPLATE_IDS),
  waxSealColorId: z.enum(WAX_SEAL_COLOR_IDS),
  fontPairingId: z.enum(FONT_PAIRING_IDS),
  textAlign: z.enum(["left", "center", "right"]),
  paperTintId: z.enum(PAPER_TINT_IDS),
  textColorId: z.enum(CARD_TEXT_COLOR_IDS).optional().default("charcoal"),
  enableAnimatedReveal: z.boolean().optional().default(true),
  showPressedPetalWatermark: z.boolean(),
  recipientName: z.string().max(256),
  senderName: z.string().max(256),
  message: z.string().max(4096),
  isVisualOnly: z.boolean(),
  audioTrackId: z.enum(AUDIO_TRACK_IDS),
});

const MEDIA_URL_RE = /^\/api\/media\/[A-Za-z0-9_-]{8,64}$/;

export const PhotoAttachmentRefSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
  url: z.string().regex(MEDIA_URL_RE),
  caption: z.string().max(160).optional(),
  aspectRatio: z.number().min(0.4).max(2.5).optional(),
});

export const VoiceMessageRefSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
  url: z.string().regex(MEDIA_URL_RE),
  mimeType: z.enum(["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav"]),
  durationSec: z.number().min(0).max(180),
});

export const BouquetSceneV1Schema = z.object({
  schemaVersion: z.literal(1),
  stems: z.array(StemInstanceSchema).max(MAX_STEMS_GLOBAL),
  presentation: PresentationConfigSchema,
  card: CardConfigSchema,
  showColophon: z.boolean(),
  hideNamesInPreview: z.boolean(),
  isPublicShowcase: z.boolean().optional(),
  occasionTag: z.enum(CANONICAL_OCCASIONS).optional(),
  photos: z.array(PhotoAttachmentRefSchema).max(6).optional(),
  voiceMessage: VoiceMessageRefSchema.nullable().optional(),
});

export function validateAndNormalizeScene(
  input: unknown,
  allowedSkuIds: ReadonlySet<string>,
  options: { requirePublishMinStems?: boolean } = {},
): { ok: true; scene: BouquetSceneV1 } | { ok: false; error: string; fieldErrors?: Record<string, string[]> } {
  const parsed = BouquetSceneV1Schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Bouquet data contains invalid configuration values.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const raw = parsed.data;
  for (const stem of raw.stems) {
    if (!allowedSkuIds.has(stem.skuId)) {
      return {
        ok: false,
        error: `Unknown or retired botanical SKU: ${stem.skuId}`,
        fieldErrors: { stems: [`Unsupported botanical item: ${stem.skuId}`] },
      };
    }
  }

  if (options.requirePublishMinStems) {
    const minRequired =
      raw.presentation.compositionPreset === "minimalist" ? MIN_STEMS_MINIMALIST : MIN_STEMS_STANDARD;
    if (raw.stems.length < minRequired) {
      return {
        ok: false,
        error: `Add at least ${minRequired} stem(s) before publishing.`,
        fieldErrors: { stems: [`Minimum ${minRequired} stems required`] },
      };
    }
  }

  const normalizedPresentation = normalizePresentationConfig(raw.presentation);
  const paperTintId = raw.card.paperTintId;
  const textColorId = raw.card.textColorId ?? (paperTintId === "charcoal" ? "pearl" : "charcoal");
  const enableAnimatedReveal = raw.card.enableAnimatedReveal ?? true;

  const sortedStems = [...raw.stems]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((s, idx) => ({
      ...s,
      y:
        normalizedPresentation.stemVisibility === "tucked"
          ? Math.min(780, Math.max(100, s.y))
          : Math.min(840, Math.max(100, s.y)),
      zIndex: idx,
    }));

  return {
    ok: true,
    scene: {
      schemaVersion: 1,
      stems: sortedStems,
      presentation: normalizedPresentation,
      card: {
        ...raw.card,
        paperTintId,
        textColorId,
        enableAnimatedReveal,
        recipientName: sanitizeTextInput(raw.card.recipientName, 40, 256),
        senderName: sanitizeTextInput(raw.card.senderName, 40, 256),
        message: sanitizeTextInput(raw.card.message, 600, 4096),
      },
      showColophon: raw.showColophon,
      hideNamesInPreview: raw.hideNamesInPreview,
      isPublicShowcase: raw.isPublicShowcase ?? false,
      occasionTag: raw.occasionTag,
      photos: raw.photos
        ? raw.photos.map((p) => ({
            ...p,
            caption: p.caption ? sanitizeTextInput(p.caption, 80, 240) : undefined,
          }))
        : undefined,
      voiceMessage: raw.voiceMessage ?? undefined,
    },
  };
}

