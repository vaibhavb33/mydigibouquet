import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { describe, expect, it } from "vitest";
import {
  BOW_STYLE_IDS,
  COMPOSITION_PRESET_IDS,
  RIBBON_COLOR_IDS,
  RIBBON_FINISH_IDS,
  VESSEL_IDS,
} from "../types";
import { ALLOWED_SKU_IDS, CATALOG_ENTRIES, CATALOG_META_MAP } from "../../generated/catalog-manifest";
import { STARTER_BOUQUETS, buildSceneFromPreset } from "../presets";
import { generateAiBouquetProposals } from "../ai-florist";
import { CORE_ELEVEN_OCCASIONS, OCCASION_TEMPLATES, applyOccasionTemplateToScene } from "../occasions";
import { arrangeBouquetByPreset, insertStemIntoOpenSlot } from "../arranger";
import { validateAndNormalizeScene } from "../validation";
import { computeArrangementSuggestions } from "../suggestions";
import { decodeHitMask, hitTestDecodedMask, type HitMaskBitset } from "../hit-mask";
import { renderBouquetToContext2D } from "../canvas-renderer";
import { wrapCardMessage } from "../../lib/card-layout";
import { resolveCardAppearance } from "../../lib/card-styles";
import {
  MAX_PHOTOS_PER_BOUQUET,
  detectAudioMimeFromBytes,
  detectPhotoMimeFromBytes,
} from "../../lib/media-validation";
import { deriveProjectTitle, isValidWorkspaceToken } from "../../lib/workspace-server";
import { BLOG_POSTS, getBlogPostBySlug, type BlogCategory } from "../../lib/blog-posts";
import {
  absoluteUrl,
  buildBreadcrumbSchema,
  buildOrganizationSchema,
  buildWebApplicationSchema,
  buildWebsiteSchema,
  serializeJsonLd,
} from "../../lib/seo";
import { assertSameOrigin, checkRateLimit } from "../../lib/request-security";
import { getDatabaseConfig } from "../../lib/env";

const PUBLIC_ROOT = path.resolve(process.cwd(), "public");

describe("Phase 1-3: Botanical Assets, Hitmasks & Composition Engine", () => {
  it("contains all 40 botanical SKUs (incl. Monstera & seasonal foliage) with compiled WebPs, hitmasks, vessels, and bows on disk", () => {
    expect(CATALOG_ENTRIES.length).toBe(40);
    expect(CATALOG_META_MAP.has("monstera-deliciosa")).toBe(true);
    expect(CATALOG_META_MAP.has("autumn-oak-foliage")).toBe(true);

    // Check morphological variations for Rose, Peony, Tulip, Sunflower, Lily
    expect(CATALOG_META_MAP.has("rose-blush-bud")).toBe(true);
    expect(CATALOG_META_MAP.has("rose-blush-half")).toBe(true);
    expect(CATALOG_META_MAP.has("rose-blush-open")).toBe(true);
    expect(CATALOG_META_MAP.has("peony-blush-small")).toBe(true);
    expect(CATALOG_META_MAP.has("peony-blush-full")).toBe(true);
    expect(CATALOG_META_MAP.has("tulip-red-upright")).toBe(true);
    expect(CATALOG_META_MAP.has("tulip-red-tilted")).toBe(true);
    expect(CATALOG_META_MAP.has("sunflower-front")).toBe(true);
    expect(CATALOG_META_MAP.has("sunflower-angled")).toBe(true);
    expect(CATALOG_META_MAP.has("lily-oriental-up")).toBe(true);
    expect(CATALOG_META_MAP.has("lily-oriental-angled")).toBe(true);

    for (const item of CATALOG_ENTRIES) {
      expect(fs.existsSync(path.join(PUBLIC_ROOT, item.thumbPath.replace(/^\//, "")))).toBe(true);
      expect(fs.existsSync(path.join(PUBLIC_ROOT, item.studioPath.replace(/^\//, "")))).toBe(true);
      expect(fs.existsSync(path.join(PUBLIC_ROOT, item.exportPath.replace(/^\//, "")))).toBe(true);
      expect(fs.existsSync(path.join(PUBLIC_ROOT, item.hitmaskPath.replace(/^\//, "")))).toBe(true);
    }

    for (const vid of VESSEL_IDS) {
      if (vid === "bare-stems") continue;
      expect(fs.existsSync(path.join(PUBLIC_ROOT, `assets/v1/vessels/${vid}-back-studio.webp`))).toBe(true);
      expect(fs.existsSync(path.join(PUBLIC_ROOT, `assets/v1/vessels/${vid}-front-studio.webp`))).toBe(true);
      expect(fs.existsSync(path.join(PUBLIC_ROOT, `assets/v1/vessels/${vid}-back-export.webp`))).toBe(true);
      expect(fs.existsSync(path.join(PUBLIC_ROOT, `assets/v1/vessels/${vid}-front-export.webp`))).toBe(true);
    }

    for (const bow of BOW_STYLE_IDS) {
      if (bow === "none") continue;
      for (const rc of RIBBON_COLOR_IDS) {
        expect(fs.existsSync(path.join(PUBLIC_ROOT, `assets/v1/ribbons/${bow}-${rc}-studio.webp`))).toBe(true);
        expect(fs.existsSync(path.join(PUBLIC_ROOT, `assets/v1/ribbons/${bow}-${rc}-export.webp`))).toBe(true);
        for (const finish of RIBBON_FINISH_IDS) {
          expect(
            fs.existsSync(path.join(PUBLIC_ROOT, `assets/v1/ribbons/finish-${finish}-${bow}-${rc}-studio.webp`)),
          ).toBe(true);
        }
      }
    }
  });

  it("supports wrapping studio finishes and all 11 occasion templates without mutating stems on style-only apply", () => {
    expect(VESSEL_IDS).toContain("wrap-natural-kraft");
    expect(VESSEL_IDS).toContain("wrap-ivory-parchment");
    expect(VESSEL_IDS).toContain("wrap-blush-linen");
    expect(VESSEL_IDS).toContain("wrap-textured-weave");
    expect(VESSEL_IDS).toContain("wrap-transparent-cellophane");
    expect(VESSEL_IDS).toContain("wrap-floral-patterned");
    expect(CORE_ELEVEN_OCCASIONS.length).toBe(11);

    const base = buildSceneFromPreset(STARTER_BOUQUETS[0]!, CATALOG_META_MAP);
    for (const occ of CORE_ELEVEN_OCCASIONS) {
      expect(OCCASION_TEMPLATES[occ.slug]).toBeDefined();
      const fullScene = applyOccasionTemplateToScene(base, occ.slug, "full", CATALOG_META_MAP);
      const validFull = validateAndNormalizeScene(fullScene, ALLOWED_SKU_IDS, { requirePublishMinStems: true });
      expect(validFull.ok).toBe(true);

      const styleOnly = applyOccasionTemplateToScene(base, occ.slug, "style-only", CATALOG_META_MAP);
      expect(styleOnly.stems).toEqual(base.stems);
      expect(styleOnly.occasionTag).toBe(occ.slug);
    }
  });

  it("accurately decodes 160px alpha bitmasks and detects bloom vs transparent background", () => {
    const roseMeta = CATALOG_META_MAP.get("rose-blush-open")!;
    const rawJson = JSON.parse(
      fs.readFileSync(path.join(PUBLIC_ROOT, roseMeta.hitmaskPath.replace(/^\//, "")), "utf8"),
    ) as HitMaskBitset;
    const decoded = decodeHitMask(rawJson);

    expect(decoded.height).toBe(160);
    // Corner pixel is transparent
    expect(hitTestDecodedMask(decoded, 0.02, 0.02, 0)).toBe(false);
    // Bloom head anchor (0.50, 0.22) is solid opaque
    expect(hitTestDecodedMask(decoded, roseMeta.anchorX, roseMeta.anchorY, 1)).toBe(true);
  });

  it("arranges all 7 presets naturally with distinct scales, zero clone collisions, and pinned locks", () => {
    const baseScene = buildSceneFromPreset(STARTER_BOUQUETS[0]!, CATALOG_META_MAP);

    for (const presetId of COMPOSITION_PRESET_IDS) {
      const arranged = arrangeBouquetByPreset(baseScene.stems, presetId, CATALOG_META_MAP);
      expect(arranged.length).toBe(baseScene.stems.length);

      const distinctPositions = new Set(arranged.map((s) => `${s.x},${s.y}`));
      expect(distinctPositions.size).toBe(arranged.length);

      const distinctScales = new Set(arranged.map((s) => s.scale));
      expect(distinctScales.size).toBeGreaterThan(1);

      for (const s of arranged) {
        expect(s.x).toBeGreaterThanOrEqual(120);
        expect(s.x).toBeLessThanOrEqual(880);
        expect(s.y).toBeGreaterThanOrEqual(100);
        expect(s.y).toBeLessThanOrEqual(840);
      }

      const foliageZs = arranged
        .filter((s) => CATALOG_META_MAP.get(s.skuId)?.role === "foliage")
        .map((s) => s.zIndex);
      const focalZs = arranged
        .filter((s) => CATALOG_META_MAP.get(s.skuId)?.role === "focal")
        .map((s) => s.zIndex);
      if (foliageZs.length > 0 && focalZs.length > 0) {
        expect(Math.max(...foliageZs)).toBeLessThan(Math.min(...focalZs));
      }
    }

    // Lock the first focal stem and verify it stays pinned across preset switches
    const lockedId = baseScene.stems[0]!.id;
    const pinnedStems = baseScene.stems.map((s, idx) =>
      idx === 0 ? { ...s, x: 333, y: 277, rotationDeg: -14, scale: 1.25, locked: true } : s,
    );
    const afterRearrange = arrangeBouquetByPreset(pinnedStems, "luxury", CATALOG_META_MAP);
    const lockedAfter = afterRearrange.find((s) => s.id === lockedId)!;
    expect(lockedAfter.x).toBe(333);
    expect(lockedAfter.y).toBe(277);
    expect(lockedAfter.rotationDeg).toBe(-14);
    expect(lockedAfter.scale).toBe(1.25);
    expect(lockedAfter.locked).toBe(true);

    // Non-destructive manual open-slot insertion avoids overlapping existing bloom centers
    const inserted = insertStemIntoOpenSlot(
      baseScene.stems,
      "sunflower-front",
      "stem-extra-1",
      "romantic",
      CATALOG_META_MAP,
    );
    expect(inserted.x).toBeGreaterThanOrEqual(160);
    expect(inserted.y).toBeGreaterThanOrEqual(140);
  });

  it("validates and normalizes all starter scenes, vessel rules, and card text wrapping", () => {
    for (const preset of STARTER_BOUQUETS) {
      const scene = buildSceneFromPreset(preset, CATALOG_META_MAP);
      const res = validateAndNormalizeScene(scene, ALLOWED_SKU_IDS, { requirePublishMinStems: true });
      expect(res.ok).toBe(true);
    }

    const glassScene = buildSceneFromPreset(STARTER_BOUQUETS[0]!, CATALOG_META_MAP);
    glassScene.presentation.vesselId = "vase-clear-glass";
    glassScene.presentation.bowStyleId = "double-bow";
    glassScene.presentation.stemVisibility = "exposed";

    const normalized = validateAndNormalizeScene(glassScene, ALLOWED_SKU_IDS, {
      requirePublishMinStems: true,
    });
    expect(normalized.ok).toBe(true);
    if (normalized.ok) {
      expect(normalized.scene.presentation.bowStyleId).toBe("none");
      expect(normalized.scene.presentation.stemVisibility).toBe("submerged");
    }

    const stubMeasure = (txt: string, font: string) => {
      const m = /(\d+)px/.exec(font);
      return txt.length * (m ? Number(m[1]) : 18) * 0.55;
    };
    const shortWrap = wrapCardMessage(stubMeasure, "Happy birthday!");
    expect(shortWrap.fontSizePx).toBe(22);
    expect(shortWrap.exceedsMaxLines).toBe(false);

    const longWrap = wrapCardMessage(
      stubMeasure,
      Array.from({ length: 18 }, () => "Wishing you sunshine and warm flowers across every season.").join(" "),
    );
    expect(longWrap.fontSizePx).toBe(15);
    expect(longWrap.exceedsMaxLines).toBe(true);

    // Smart arrangement suggestions & custom card styling contrast resolution
    const suggestions = computeArrangementSuggestions(glassScene, CATALOG_META_MAP);
    expect(COMPOSITION_PRESET_IDS).toContain(suggestions.recommendedPreset);
    expect(suggestions.complementaryStems.length).toBeGreaterThan(0);

    const customCard = resolveCardAppearance({
      ...glassScene.card,
      paperTintId: "charcoal",
      textColorId: "charcoal",
    });
    expect(customCard.isDarkBackground).toBe(true);
    expect(customCard.autoContrastAdjusted).toBe(true);
    expect(customCard.textColor).toBe("#F5F2EB");
  });
});

describe("Phase 6: High-Res Canvas Export Renderer Parity & Transparent Cutouts", () => {
  async function nodeLoadImage(relSrc: string): Promise<CanvasImageSource | null> {
    const abs = path.join(PUBLIC_ROOT, relSrc.replace(/^\//, ""));
    if (!fs.existsSync(abs)) return null;
    const pngBuf = await sharp(abs).png().toBuffer();
    const img = await loadImage(pngBuf);
    return img as unknown as CanvasImageSource;
  }

  it("renders pixel-exact 1:1 linen export, charcoal slate dark polarity, and true alpha transparent cutout PNG", async () => {
    const scene = buildSceneFromPreset(STARTER_BOUQUETS[0]!, CATALOG_META_MAP);
    const assetCache = new Map<string, CanvasImageSource | null>();
    const store = {
      async loadImage(src: string) {
        if (assetCache.has(src)) return assetCache.get(src) ?? null;
        const img = await nodeLoadImage(src);
        assetCache.set(src, img);
        return img;
      },
    };

    // 1. Transparent cutout export test (1500x1800 scaled test at 750x900 for crisp assertion)
    const tW = 750;
    const tH = 900;
    const tCanvas = createCanvas(tW, tH);
    const tCtx = tCanvas.getContext("2d");
    await renderBouquetToContext2D(
      tCtx as unknown as CanvasRenderingContext2D,
      tW,
      tH,
      scene,
      CATALOG_META_MAP,
      store,
      {
        aspect: "transparent",
        mimeType: "image/png",
        includeCardNote: false,
        includeColophon: false,
        useExportLod: true,
      },
    );

    const tRaw = await sharp(tCanvas.toBuffer("image/png")).ensureAlpha().raw().toBuffer();
    // Top-left corner pixel (0,0) must have alpha === 0 (truly transparent background!)
    expect(tRaw[3]).toBe(0);
    // Center crown pixel around (375, 360) must be opaque flower mass
    const centerIdx = (360 * tW + 375) * 4;
    expect(tRaw[centerIdx + 3]).toBeGreaterThan(200);

    // 2. Opaque 1:1 Linen vs Dark Slate Tabletop export contrast verification
    const sqCanvas = createCanvas(800, 800);
    const sqCtx = sqCanvas.getContext("2d");
    await renderBouquetToContext2D(
      sqCtx as unknown as CanvasRenderingContext2D,
      800,
      800,
      scene,
      CATALOG_META_MAP,
      store,
      {
        aspect: "square",
        mimeType: "image/png",
        includeCardNote: true,
        includeColophon: true,
        useExportLod: true,
      },
    );
    const linenPixel = await sharp(sqCanvas.toBuffer("image/png")).ensureAlpha().raw().toBuffer();
    expect(linenPixel[0]).toBeGreaterThan(220); // bright warm linen corner

    const slateScene = {
      ...scene,
      presentation: { ...scene.presentation, tableSurfaceId: "slate" as const },
    };
    const slateCanvas = createCanvas(800, 800);
    const slateCtx = slateCanvas.getContext("2d");
    await renderBouquetToContext2D(
      slateCtx as unknown as CanvasRenderingContext2D,
      800,
      800,
      slateScene,
      CATALOG_META_MAP,
      store,
      {
        aspect: "square",
        mimeType: "image/png",
        includeCardNote: true,
        includeColophon: true,
        useExportLod: true,
      },
    );
    const slatePixel = await sharp(slateCanvas.toBuffer("image/png")).ensureAlpha().raw().toBuffer();
    expect(slatePixel[0]).toBeLessThan(70); // dark charcoal slate corner
  });
});

describe("Milestone B: Media Attachment Magic-Byte Validation & Scene Schema", () => {
  it("validates image magic bytes and rejects SVG/HTML payloads", () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(detectPhotoMimeFromBytes(jpeg)).toBe("image/jpeg");

    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(detectPhotoMimeFromBytes(png)).toBe("image/png");

    const webp = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x24, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
    ]);
    expect(detectPhotoMimeFromBytes(webp)).toBe("image/webp");

    const svgBytes = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    expect(detectPhotoMimeFromBytes(svgBytes)).toBeNull();

    const htmlBytes = Buffer.from("<html><body>bad</body></html>");
    expect(detectPhotoMimeFromBytes(htmlBytes)).toBeNull();
  });

  it("validates audio magic bytes for WebM, WAV, Ogg, MP3, and MP4", () => {
    const webm = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(detectAudioMimeFromBytes(webm)).toBe("audio/webm");

    const wav = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x24, 0, 0, 0, 0x57, 0x41, 0x56, 0x45,
    ]);
    expect(detectAudioMimeFromBytes(wav)).toBe("audio/wav");

    const ogg = new Uint8Array([0x4f, 0x67, 0x67, 0x53, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(detectAudioMimeFromBytes(ogg)).toBe("audio/ogg");

    const mp3 = new Uint8Array([0x49, 0x44, 0x33, 0x03, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(detectAudioMimeFromBytes(mp3)).toBe("audio/mpeg");

    const fakePng = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(detectAudioMimeFromBytes(fakePng)).toBeNull();
  });

  it("preserves photos & voiceMessage on BouquetSceneV1Schema and enforces MAX_PHOTOS_PER_BOUQUET", () => {
    const base = buildSceneFromPreset(STARTER_BOUQUETS[0]!, CATALOG_META_MAP);
    const validPhotos = Array.from({ length: MAX_PHOTOS_PER_BOUQUET }, (_, idx) => ({
      id: `photo_item_${idx}`,
      url: `/api/media/photo_item_${idx}`,
      caption: `Memory ${idx + 1}`,
      aspectRatio: 0.8,
    }));
    const res = validateAndNormalizeScene(
      {
        ...base,
        photos: validPhotos,
        voiceMessage: {
          id: "voice_note_1",
          url: "/api/media/voice_note_1",
          durationSec: 12.4,
          mimeType: "audio/webm",
        },
      },
      ALLOWED_SKU_IDS,
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.scene.photos).toHaveLength(MAX_PHOTOS_PER_BOUQUET);
      expect(res.scene.voiceMessage?.id).toBe("voice_note_1");
    }

    const overflowRes = validateAndNormalizeScene(
      {
        ...base,
        photos: [
          ...validPhotos,
          {
            id: "photo_overflow_7",
            url: "/api/media/photo_overflow_7",
            caption: "Too many",
            aspectRatio: 1,
          },
        ],
      },
      ALLOWED_SKU_IDS,
    );
    expect(overflowRes.ok).toBe(false);

    // Reject path traversal / SVG media URLs
    const traversalRes = validateAndNormalizeScene(
      {
        ...base,
        photos: [
          {
            id: "photo_item_0",
            url: "/api/media/../../secret",
            caption: "Bad path",
            aspectRatio: 1,
          },
        ],
      },
      ALLOWED_SKU_IDS,
    );
    expect(traversalRes.ok).toBe(false);
  });
});

describe("Milestone D: Workspace Token Validation & Saved Draft Title Derivation", () => {
  it("validates workspace tokens and derives clean titles", () => {
    expect(isValidWorkspaceToken("atelier_ws_token_123456")).toBe(true);
    expect(isValidWorkspaceToken("short")).toBe(false);
    expect(isValidWorkspaceToken("bad token with spaces!")).toBe(false);

    const base = buildSceneFromPreset(STARTER_BOUQUETS[0]!, CATALOG_META_MAP);
    expect(deriveProjectTitle(base, "Anniversary Blooms\u0000")).toBe("Anniversary Blooms");
    expect(
      deriveProjectTitle({
        ...base,
        card: { ...base.card, recipientName: "Maya" },
      }),
    ).toBe("For Maya");
    expect(
      deriveProjectTitle({
        ...base,
        occasionTag: "mothers-day",
        card: { ...base.card, recipientName: "" },
      }),
    ).toBe("Mother's Day Bouquet");
  });
});

describe("Milestone E: AI Bouquet Assistant Editable Proposals", () => {
  it("generates 3 valid, schema-normalized bouquet proposals with editable individual stems", () => {
    const base = buildSceneFromPreset(STARTER_BOUQUETS[0]!, CATALOG_META_MAP);
    const currentWithNames = {
      ...base,
      card: {
        ...base.card,
        recipientName: "Elena",
        senderName: "Julian",
      },
    };

    const proposals = generateAiBouquetProposals({
      prompt: "Bright yellow sunflowers and wildflowers for a cheerful birthday",
      currentScene: currentWithNames,
      metaMap: CATALOG_META_MAP,
    });

    expect(proposals).toHaveLength(3);
    expect(proposals[0]!.occasionTag).toBe("birthday");

    for (const proposal of proposals) {
      expect(proposal.scene.stems.length).toBeGreaterThanOrEqual(5);
      expect(proposal.scene.stems.length).toBeLessThanOrEqual(30);
      expect(proposal.scene.card.recipientName).toBe("Elena");
      expect(proposal.scene.card.senderName).toBe("Julian");
      const validated = validateAndNormalizeScene(proposal.scene, ALLOWED_SKU_IDS);
      expect(validated.ok).toBe(true);
      for (const stem of proposal.scene.stems) {
        expect(ALLOWED_SKU_IDS.has(stem.skuId)).toBe(true);
        expect(stem.locked).toBe(false);
      }
    }

    const idsSet = new Set(proposals[0]!.scene.stems.map((s) => s.skuId));
    expect(
      idsSet.has("sunflower-front") || idsSet.has("sunflower-angled") || idsSet.has("tulip-yellow-tilted"),
    ).toBe(true);
  });
});

describe("Phase 6 SEO: Schemas, Blog Pillars & Privacy-Aware Showcase Flag", () => {
  it("covers all 7 blog categories with unique slugs and valid WebP covers on disk", () => {
    const expectedCategories: BlogCategory[] = [
      "Digital Gifting",
      "Flower Meanings",
      "Bouquet Ideas",
      "Birthday Messages",
      "Anniversary Gifts",
      "Virtual Flowers",
      "Digital Greeting Inspiration",
    ];
    const slugs = new Set<string>();
    const seenCategories = new Set<BlogCategory>();

    for (const post of BLOG_POSTS) {
      expect(slugs.has(post.slug)).toBe(false);
      slugs.add(post.slug);
      seenCategories.add(post.category);
      expect(post.coverAlt.length).toBeGreaterThan(10);
      expect(post.sections.length).toBeGreaterThan(0);
      const coverPath = path.join(PUBLIC_ROOT, post.coverImage.replace(/^\//, ""));
      expect(fs.existsSync(coverPath)).toBe(true);
      expect(getBlogPostBySlug(post.slug)?.title).toBe(post.title);
    }

    for (const cat of expectedCategories) {
      expect(seenCategories.has(cat)).toBe(true);
    }
    expect(getBlogPostBySlug("nonexistent-post-slug")).toBeUndefined();
  });

  it("serializes XSS-safe JSON-LD schemas and parameter-free canonical URLs", () => {
    const payload = serializeJsonLd({ html: "<script>alert(1)</script>" });
    expect(payload).not.toContain("<");
    expect(payload).toContain("\\u003c");

    expect(absoluteUrl("/")).toBe("https://mydigibouquet.com");
    expect(absoluteUrl("/flowers/rose")).toBe("https://mydigibouquet.com/flowers/rose");

    const org = buildOrganizationSchema();
    expect(org["@type"]).toBe("Organization");
    const website = buildWebsiteSchema();
    expect(website["@type"]).toBe("WebSite");
    expect(website.potentialAction.target.urlTemplate).toContain("/flowers?q={search_term_string}");

    const webApp = buildWebApplicationSchema();
    expect(webApp["@type"]).toBe("WebApplication");
    expect(webApp.url).toBe("https://mydigibouquet.com/studio");

    const crumbs = buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Journal", path: "/blog" },
    ]);
    expect(crumbs["@type"]).toBe("BreadcrumbList");
    expect(crumbs.itemListElement).toHaveLength(2);
    expect(crumbs.itemListElement[1]!.position).toBe(2);
  });

  it("defaults isPublicShowcase to false and preserves explicit public opt-in on valid scenes", () => {
    const base = buildSceneFromPreset(STARTER_BOUQUETS[0]!, CATALOG_META_MAP);
    const defaultValidated = validateAndNormalizeScene(base, ALLOWED_SKU_IDS);
    expect(defaultValidated.ok).toBe(true);
    if (defaultValidated.ok) {
      expect(defaultValidated.scene.isPublicShowcase).toBe(false);
    }

    const optInValidated = validateAndNormalizeScene(
      { ...base, isPublicShowcase: true },
      ALLOWED_SKU_IDS,
    );
    expect(optInValidated.ok).toBe(true);
    if (optInValidated.ok) {
      expect(optInValidated.scene.isPublicShowcase).toBe(true);
    }
  });
});

describe("Phase 7 Release Security: CSRF Origin Check, Rate Limiter & Env Mode Detection", () => {
  it("enforces same-origin on browser requests and rejects mismatched Origin with HTTP 403", () => {
    const sameOriginReq = new Request("https://mydigibouquet.com/api/bouquets", {
      method: "POST",
      headers: {
        host: "mydigibouquet.com",
        origin: "https://mydigibouquet.com",
      },
    });
    expect(assertSameOrigin(sameOriginReq)).toBeNull();

    const serverClientReq = new Request("https://mydigibouquet.com/api/bouquets", {
      method: "POST",
      headers: { host: "mydigibouquet.com" },
    });
    expect(assertSameOrigin(serverClientReq)).toBeNull();

    const crossOriginReq = new Request("https://mydigibouquet.com/api/bouquets", {
      method: "POST",
      headers: {
        host: "mydigibouquet.com",
        origin: "https://evil.example",
      },
    });
    const blocked = assertSameOrigin(crossOriginReq);
    expect(blocked).not.toBeNull();
    expect(blocked?.status).toBe(403);
  });

  it("applies sliding-window rate limits per bucket and emits Retry-After on HTTP 429", () => {
    const bucket = `unit-test-bucket-${Date.now()}`;
    const makeReq = (ip: string) =>
      new Request("https://mydigibouquet.com/api/contact", {
        method: "POST",
        headers: { "x-forwarded-for": ip },
      });

    expect(checkRateLimit(makeReq("203.0.113.10"), { bucket, limit: 2, windowMs: 60_000 })).toBeNull();
    expect(checkRateLimit(makeReq("203.0.113.10"), { bucket, limit: 2, windowMs: 60_000 })).toBeNull();
    const limited = checkRateLimit(makeReq("203.0.113.10"), { bucket, limit: 2, windowMs: 60_000 });
    expect(limited).not.toBeNull();
    expect(limited?.status).toBe(429);
    expect(Number(limited?.headers.get("Retry-After"))).toBeGreaterThanOrEqual(1);

    // Distinct IP remains unaffected
    expect(checkRateLimit(makeReq("203.0.113.11"), { bucket, limit: 2, windowMs: 60_000 })).toBeNull();
  });

  it("detects local-sqlite vs remote-libsql cleanly and uses /tmp on read-only serverless", () => {
    const prevUrl = process.env.DATABASE_URL;
    const prevVercel = process.env.VERCEL;
    try {
      delete process.env.DATABASE_URL;
      delete process.env.VERCEL;
      const localCfg = getDatabaseConfig();
      expect(localCfg.mode).toBe("local-sqlite");
      expect(localCfg.url).toBe("file:./local.db");

      process.env.VERCEL = "1";
      const vercelTmpCfg = getDatabaseConfig();
      expect(vercelTmpCfg.mode).toBe("local-sqlite");
      expect(vercelTmpCfg.url).toBe("file:/tmp/mydigibouquet.db");

      process.env.DATABASE_URL = "libsql://petal-prod.turso.io";
      const remoteCfg = getDatabaseConfig();
      expect(remoteCfg.mode).toBe("remote-libsql");
      expect(remoteCfg.url).toBe("libsql://petal-prod.turso.io");
    } finally {
      if (prevUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = prevUrl;
      if (prevVercel === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = prevVercel;
    }
  });
});
