import {
  BotanicalMeta,
  BouquetSceneV1,
  CARD_TEXT_COLOR_STYLES,
  COLLAR_ANCHOR_X,
  StemInstance,
  TableSurfaceId,
  VESSEL_RULES,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "./types";
import { wrapCardMessage } from "@/lib/card-layout";

export type ExportAspectPreset = "square" | "story" | "portrait" | "transparent";

export type ExportRenderOptions = {
  aspect: ExportAspectPreset;
  mimeType: "image/png" | "image/jpeg";
  includeCardNote?: boolean;
  includeColophon?: boolean;
  useExportLod?: boolean;
};

export const EXPORT_DIMENSIONS: Record<ExportAspectPreset, { width: number; height: number; label: string }> = {
  square: { width: 1600, height: 1600, label: "1:1 Keepsake Square (1600×1600)" },
  portrait: { width: 1440, height: 1800, label: "4:5 Editorial Portrait (1440×1800)" },
  story: { width: 1080, height: 1920, label: "9:16 Story Frame (1080×1920)" },
  transparent: { width: 1500, height: 1800, label: "Transparent Cutout PNG (1500×1800)" },
};

export type LoadedAssetStore = {
  loadImage: (src: string) => Promise<CanvasImageSource | null>;
};

export function isFrontDrapeStem(
  _stem: StemInstance,
  meta: BotanicalMeta | undefined,
  _totalStems: number,
): boolean {
  // Only stemless loose petals drape over the front rim; all stemmed florals tuck inside the vessel pocket
  return meta?.role === "petal";
}

export function resolveBowAssetPath(
  presentation: BouquetSceneV1["presentation"],
  lodSuffix: "studio" | "export",
): string | null {
  const vesselRule = VESSEL_RULES[presentation.vesselId];
  if (!vesselRule.supportsBow || presentation.bowStyleId === "none") return null;
  if (presentation.ribbonFinishId) {
    return `/assets/v1/ribbons/finish-${presentation.ribbonFinishId}-${presentation.bowStyleId}-${presentation.ribbonColorId}-${lodSuffix}.webp`;
  }
  return `/assets/v1/ribbons/${presentation.bowStyleId}-${presentation.ribbonColorId}-${lodSuffix}.webp`;
}

export function getPocketClipPath(vesselId: BouquetSceneV1["presentation"]["vesselId"]): [number, number][] {
  const rule = VESSEL_RULES[vesselId];
  const poly = rule.pocketMaskPolygon;
  const topLeft = poly[0] ?? [340, 680];
  const topRight = poly[1] ?? [660, 680];
  const restRightDown = poly.slice(1);
  return [
    [-400, -400],
    [WORLD_WIDTH + 400, -400],
    [WORLD_WIDTH + 400, topRight[1]],
    ...restRightDown,
    topLeft,
    [-400, topLeft[1]],
  ];
}

export function computeBouquetWorldBounds(
  scene: BouquetSceneV1,
  metaMap: ReadonlyMap<string, BotanicalMeta>,
): { minX: number; minY: number; maxX: number; maxY: number } {
  const vessel = VESSEL_RULES[scene.presentation.vesselId];
  let minX = vessel.vesselId === "bare-stems" ? 360 : 255;
  let maxX = vessel.vesselId === "bare-stems" ? 640 : 745;
  let minY = 175;
  let maxY = scene.presentation.stemVisibility === "exposed" ? 1110 : 1090;

  for (const stem of scene.stems) {
    const meta = metaMap.get(stem.skuId);
    const radius = (meta?.headRadiusWorld ?? 65) * stem.scale;
    const ext = radius * 1.45;
    minX = Math.min(minX, stem.x - ext);
    maxX = Math.max(maxX, stem.x + ext);
    minY = Math.min(minY, stem.y - ext * 1.25);
    maxY = Math.max(maxY, stem.y + (stem.y > 600 ? ext * 0.8 : 0));
  }

  return {
    minX: Math.max(-120, minX),
    minY: Math.max(-100, minY),
    maxX: Math.min(WORLD_WIDTH + 120, maxX),
    maxY: Math.min(WORLD_HEIGHT + 80, maxY),
  };
}

export const TABLE_SURFACE_THEMES: Record<
  TableSurfaceId,
  { bgTop: string; bgBottom: string; glow: string; grain: string; isDark: boolean; label: string; swatch: string }
> = {
  linen: {
    bgTop: "#F8F5EE",
    bgBottom: "#ECE6DA",
    glow: "rgba(255, 252, 245, 0.72)",
    grain: "rgba(130, 118, 98, 0.04)",
    isDark: false,
    label: "Natural Linen",
    swatch: "#F1ECE1",
  },
  limewash: {
    bgTop: "#EFEBE3",
    bgBottom: "#E2DCD0",
    glow: "rgba(255, 250, 240, 0.55)",
    grain: "rgba(105, 96, 84, 0.05)",
    isDark: false,
    label: "Plaster Limewash",
    swatch: "#E7E1D6",
  },
  travertine: {
    bgTop: "#E8E0D4",
    bgBottom: "#D9CEBE",
    glow: "rgba(250, 244, 232, 0.48)",
    grain: "rgba(116, 100, 82, 0.06)",
    isDark: false,
    label: "Warm Travertine",
    swatch: "#DFD5C6",
  },
  slate: {
    bgTop: "#272A27",
    bgBottom: "#171917",
    glow: "rgba(92, 102, 90, 0.22)",
    grain: "rgba(255, 255, 255, 0.03)",
    isDark: true,
    label: "Charcoal Slate",
    swatch: "#222522",
  },
};

export function drawTableSurface(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  surfaceId: TableSurfaceId,
): void {
  const theme = TABLE_SURFACE_THEMES[surfaceId];
  const lin = ctx.createLinearGradient(0, 0, 0, height);
  lin.addColorStop(0, theme.bgTop);
  lin.addColorStop(1, theme.bgBottom);
  ctx.fillStyle = lin;
  ctx.fillRect(0, 0, width, height);

  const rad = ctx.createRadialGradient(
    width * 0.5,
    height * 0.36,
    width * 0.06,
    width * 0.5,
    height * 0.45,
    Math.max(width, height) * 0.72,
  );
  rad.addColorStop(0, theme.glow);
  rad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, width, height);

  // Subtle architectural linen/mineral horizontal weave texture
  ctx.save();
  ctx.strokeStyle = theme.grain;
  ctx.lineWidth = 1;
  const step = surfaceId === "linen" ? 10 : 18;
  for (let y = 0; y < height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStemImage(
  ctx: CanvasRenderingContext2D,
  stem: StemInstance,
  meta: BotanicalMeta,
  img: CanvasImageSource,
  shadowAlpha = 0,
): void {
  ctx.save();
  ctx.translate(stem.x, stem.y);
  ctx.rotate((stem.rotationDeg * Math.PI) / 180);
  ctx.scale(stem.scale * (stem.flippedX ? -1 : 1), stem.scale);

  if (shadowAlpha > 0) {
    ctx.shadowColor = `rgba(31, 30, 26, ${shadowAlpha})`;
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 9;
  }

  ctx.drawImage(
    img,
    -meta.anchorX * meta.naturalWidth,
    -meta.anchorY * meta.naturalHeight,
    meta.naturalWidth,
    meta.naturalHeight,
  );
  ctx.restore();
}

export async function renderBouquetToContext2D(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  scene: BouquetSceneV1,
  metaMap: ReadonlyMap<string, BotanicalMeta>,
  assetStore: LoadedAssetStore,
  options: ExportRenderOptions,
): Promise<void> {
  const isTransparent = options.aspect === "transparent" && options.mimeType === "image/png";
  const lodSuffix = options.useExportLod ? "export" : "studio";
  const vesselRule = VESSEL_RULES[scene.presentation.vesselId];
  const sortedStems = [...scene.stems].sort((a, b) => a.zIndex - b.zIndex);

  // 1. Preload required botanical, vessel, and ribbon images in deterministic sequence
  const skuImgMap = new Map<string, CanvasImageSource | null>();
  for (const s of sortedStems) {
    if (!skuImgMap.has(s.skuId)) {
      const meta = metaMap.get(s.skuId);
      const src = meta ? (options.useExportLod ? meta.exportPath : meta.studioPath) : null;
      skuImgMap.set(s.skuId, src ? await assetStore.loadImage(src) : null);
    }
  }

  let vesselBackImg: CanvasImageSource | null = null;
  let vesselFrontImg: CanvasImageSource | null = null;
  if (scene.presentation.vesselId !== "bare-stems") {
    vesselBackImg = await assetStore.loadImage(
      `/assets/v1/vessels/${scene.presentation.vesselId}-back-${lodSuffix}.webp`,
    );
    vesselFrontImg = await assetStore.loadImage(
      `/assets/v1/vessels/${scene.presentation.vesselId}-front-${lodSuffix}.webp`,
    );
  }

  let bowImg: CanvasImageSource | null = null;
  const bowSrc = resolveBowAssetPath(scene.presentation, lodSuffix);
  if (bowSrc) {
    bowImg = await assetStore.loadImage(bowSrc);
  }

  // 2. Paint Canvas Surface or Clear Transparent Canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  if (!isTransparent) {
    drawTableSurface(ctx, canvasWidth, canvasHeight, scene.presentation.tableSurfaceId);
  }

  // 3. Compute Anti-Clip Fit Transform from Bouquet World Bounds -> Export Rect
  const showNoteBand =
    Boolean(options.includeCardNote) &&
    !scene.card.isVisualOnly &&
    scene.card.message.trim().length > 0 &&
    !isTransparent;

  const padX = canvasWidth * 0.08;
  const padTop = canvasHeight * (options.aspect === "story" ? 0.11 : 0.075);
  const padBottom = canvasHeight * (showNoteBand ? 0.27 : options.aspect === "story" ? 0.14 : 0.09);

  const targetW = canvasWidth - padX * 2;
  const targetH = canvasHeight - padTop - padBottom;
  const bounds = computeBouquetWorldBounds(scene, metaMap);
  const worldSpanX = Math.max(380, bounds.maxX - bounds.minX);
  const worldSpanY = Math.max(520, bounds.maxY - bounds.minY);
  const fitScale = Math.min(targetW / worldSpanX, targetH / worldSpanY);

  const bouquetCenterX = (bounds.minX + bounds.maxX) * 0.5;
  const bouquetCenterY = (bounds.minY + bounds.maxY) * 0.5;
  const destCenterX = canvasWidth * 0.5;
  const destCenterY = padTop + targetH * 0.5;

  ctx.save();
  ctx.translate(destCenterX, destCenterY);
  ctx.scale(fitScale, fitScale);
  ctx.translate(-bouquetCenterX, -bouquetCenterY);

  // 3A. Grounded Tabletop Cast Shadow (skipped in transparent cutout export)
  if (!isTransparent) {
    ctx.save();
    const shadowY = scene.presentation.vesselId === "bare-stems" ? 965 : 1085;
    const baseGrad = ctx.createRadialGradient(COLLAR_ANCHOR_X, shadowY, 18, COLLAR_ANCHOR_X, shadowY, 215);
    baseGrad.addColorStop(0, "rgba(25, 22, 18, 0.24)");
    baseGrad.addColorStop(0.55, "rgba(25, 22, 18, 0.09)");
    baseGrad.addColorStop(1, "rgba(25, 22, 18, 0)");
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.ellipse(COLLAR_ANCHOR_X, shadowY, 215, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3B. Vessel Back Layer
  if (vesselBackImg) {
    ctx.drawImage(vesselBackImg, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }

  // 3C. Back & Core Stems (with pocket mask clipping for tucked/submerged visibility)
  const backStems = sortedStems.filter((s) => !isFrontDrapeStem(s, metaMap.get(s.skuId), sortedStems.length));
  const frontDrapeStems = sortedStems.filter((s) => isFrontDrapeStem(s, metaMap.get(s.skuId), sortedStems.length));

  const applyClip =
    scene.presentation.stemVisibility !== "exposed" && scene.presentation.vesselId !== "bare-stems";

  ctx.save();
  if (applyClip) {
    const poly = getPocketClipPath(scene.presentation.vesselId);
    ctx.beginPath();
    poly.forEach(([px, py], i) => {
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.clip();
  }

  backStems.forEach((stem, idx) => {
    const meta = metaMap.get(stem.skuId);
    const img = skuImgMap.get(stem.skuId);
    if (!meta || !img) return;
    const depthShadow = idx > backStems.length * 0.45 ? 0.14 : 0.08;
    drawStemImage(ctx, stem, meta, img, depthShadow);
  });
  ctx.restore();

  // 3D. Vessel Front Cuff / Glass Specular Highlights / Stoneware Body
  if (vesselFrontImg) {
    ctx.drawImage(vesselFrontImg, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }

  // 3E. Front-Drape Cascading Greenery Over Vessel Rim
  for (const stem of frontDrapeStems) {
    const meta = metaMap.get(stem.skuId);
    const img = skuImgMap.get(stem.skuId);
    if (!meta || !img) continue;
    drawStemImage(ctx, stem, meta, img, 0.16);
  }

  // 3F. Collar Bow / Ribbon / Wax Seal Band
  if (bowImg) {
    const bowWorldSize = 320;
    ctx.save();
    ctx.shadowColor = "rgba(25, 22, 18, 0.18)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    ctx.drawImage(
      bowImg,
      COLLAR_ANCHOR_X - bowWorldSize * 0.5,
      vesselRule.collarY - bowWorldSize * 0.48,
      bowWorldSize,
      bowWorldSize,
    );
    ctx.restore();
  }

  ctx.restore(); // End world-space transform

  // 4. Optional Keepsake Note Band & Studio Colophon (Polarity matches tabletop!)
  if (!isTransparent) {
    const surfaceTheme = TABLE_SURFACE_THEMES[scene.presentation.tableSurfaceId];
    const requestedCardInk = scene.card.textColorId
      ? CARD_TEXT_COLOR_STYLES[scene.card.textColorId]?.hex
      : undefined;
    const primaryInk = surfaceTheme.isDark
      ? "#F2ECE1"
      : requestedCardInk && scene.card.textColorId !== "pearl"
        ? requestedCardInk
        : "#24231F";
    const mutedInk = surfaceTheme.isDark ? "#BBB4A8" : "#6F6A62";

    if (showNoteBand) {
      const cardBandY = canvasHeight - padBottom + canvasHeight * 0.025;
      const maxMsgW = canvasWidth * 0.78;
      ctx.save();
      ctx.fillStyle = primaryInk;
      ctx.textAlign = "center";
      const measureFn = (txt: string, fnt: string) => {
        ctx.font = fnt;
        return ctx.measureText(txt).width;
      };
      const wrapped = wrapCardMessage(measureFn, scene.card.message, maxMsgW, "Georgia, serif");
      const fontSize = Math.round(wrapped.fontSizePx * (canvasWidth / 920));
      ctx.font = `italic ${fontSize}px Georgia, "Times New Roman", serif`;
      const visibleLines = wrapped.lines.slice(0, 4);
      const lineStep = fontSize * 1.38;
      visibleLines.forEach((line, i) => {
        ctx.fillText(line, canvasWidth * 0.5, cardBandY + i * lineStep);
      });

      const senderLabel =
        !scene.hideNamesInPreview && scene.card.senderName.trim()
          ? `— ${scene.card.senderName.trim()}`
          : "";
      if (senderLabel) {
        ctx.fillStyle = mutedInk;
        ctx.font = `500 ${Math.max(22, Math.round(fontSize * 0.78))}px system-ui, sans-serif`;
        ctx.fillText(senderLabel, canvasWidth * 0.5, cardBandY + visibleLines.length * lineStep + 18);
      }
      ctx.restore();
    }

    if (options.includeColophon ?? scene.showColophon) {
      ctx.save();
      ctx.fillStyle = mutedInk;
      ctx.globalAlpha = 0.78;
      ctx.font = `500 ${Math.round(canvasWidth * 0.017)}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "right";
      ctx.fillText("PETAL & PROSE STUDIO", canvasWidth - canvasWidth * 0.055, canvasHeight - canvasHeight * 0.036);
      ctx.restore();
    }
  }
}

const SHARED_BROWSER_IMAGE_CACHE = new Map<string, Promise<CanvasImageSource | null>>();

export function createBrowserAssetStore(): LoadedAssetStore {
  return {
    loadImage(src: string): Promise<CanvasImageSource | null> {
      const cached = SHARED_BROWSER_IMAGE_CACHE.get(src);
      if (cached) return cached;

      const p = new Promise<CanvasImageSource | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = async () => {
          try {
            if (typeof img.decode === "function") {
              await img.decode();
            }
          } catch {
            // Decode errors still fall back cleanly to loaded element
          }
          resolve(img);
        };
        img.onerror = () => resolve(null);
        img.src = src;
      });
      SHARED_BROWSER_IMAGE_CACHE.set(src, p);
      return p;
    },
  };
}

export async function exportBouquetBlob(
  scene: BouquetSceneV1,
  metaMap: ReadonlyMap<string, BotanicalMeta>,
  options: ExportRenderOptions,
): Promise<{ blob: Blob; width: number; height: number; filename: string }> {
  const dims = EXPORT_DIMENSIONS[options.aspect];
  const canvas = document.createElement("canvas");
  canvas.width = dims.width;
  canvas.height = dims.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not initialize 2D export canvas.");
  }

  const assetStore = createBrowserAssetStore();
  await renderBouquetToContext2D(ctx, dims.width, dims.height, scene, metaMap, assetStore, {
    ...options,
    useExportLod: true,
  });

  const resolvedMime = options.aspect === "transparent" ? "image/png" : options.mimeType;
  const ext = resolvedMime === "image/png" ? "png" : "jpg";
  const filename = `petal-and-prose-${options.aspect}.${ext}`;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) reject(new Error("Canvas export produced an empty file."));
        else resolve(b);
      },
      resolvedMime,
      resolvedMime === "image/jpeg" ? 0.94 : undefined,
    );
  });

  return { blob, width: dims.width, height: dims.height, filename };
}
