import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { WORLD_MASTER_ASPECT } from "./catalog-data.mjs";

const ROOT = process.cwd();
const BRAIN_DIR = "/Users/vaibhavborkar/.gemini/antigravity/brain/c62c1c43-b788-4546-801f-f5aa078f6908";
const OUT_FLOWERS = path.join(ROOT, "assets-master", "flowers");

const REAL_PHOTOS = {
  "babys-breath": path.join(BRAIN_DIR, "babys_breath_slate_grey_1794463968256.jpg"),
  "rose-crimson-open": path.join(BRAIN_DIR, "v2_rose_crimson_open_1794464264557.jpg"),
  "rose-blush-open": path.join(BRAIN_DIR, "v2_rose_blush_open_1794464284476.jpg"),
  "rose-probe-apricot": path.join(BRAIN_DIR, "probe_rose_1794463766222.jpg"),
  "peony-blush-full": path.join(BRAIN_DIR, "v2_peony_blush_full_1794464262895.jpg"),
  "peony-blush-small": path.join(BRAIN_DIR, "v2_peony_blush_small_1794464281052.jpg"),
  "peony-coral-full": path.join(BRAIN_DIR, "v2_peony_coral_full_1794464299411.jpg"),
  "tulip-blush-upright": path.join(BRAIN_DIR, "v2_tulip_blush_upright_1794464270674.jpg"),
  "sunflower-front": path.join(BRAIN_DIR, "v2_sunflower_front_1794464288277.jpg"),
  "hydrangea-blue": path.join(BRAIN_DIR, "v2_hydrangea_blue_1794464274262.jpg"),
  "ranunculus-peach": path.join(BRAIN_DIR, "v2_ranunculus_peach_1794464290369.jpg"),
  "meadow-aster": path.join(BRAIN_DIR, "v2_meadow_aster_1794464303924.jpg"),
  "pine-sprig": path.join(BRAIN_DIR, "v2_pine_sprig_1794464301557.jpg"),
  // Newly generated fine-art florist studio masters
  "carnation-blush": path.join(BRAIN_DIR, "v2_carnation_blush_1794540810188.jpg"),
  "camellia-white": path.join(BRAIN_DIR, "v2_camellia_white_1794540820038.jpg"),
  "zinnia-amber": path.join(BRAIN_DIR, "v2_zinnia_amber_1794540831322.jpg"),
  "magnolia-ivory": path.join(BRAIN_DIR, "v2_magnolia_ivory_1794540842340.jpg"),
  "dahlia-burgundy": path.join(BRAIN_DIR, "v2_dahlia_burgundy_1794540870188.jpg"),
  "anemone-blush": path.join(BRAIN_DIR, "v2_anemone_blush_1794540880798.jpg"),
  "eucalyptus-silver": path.join(BRAIN_DIR, "v2_eucalyptus_silver_1794540810455.jpg"),
  "eucalyptus-seeded": path.join(BRAIN_DIR, "v2_eucalyptus_seeded_1794540821936.jpg"),
  "ruscus-italian": path.join(BRAIN_DIR, "v2_ruscus_italian_1794540831846.jpg"),
  "olive-branch": path.join(BRAIN_DIR, "v2_olive_branch_1794540842075.jpg"),
  "leatherleaf-fern": path.join(BRAIN_DIR, "v2_leatherleaf_fern_1794540869383.jpg"),
  "salal-lemon-leaf": path.join(BRAIN_DIR, "v2_salal_lemon_leaf_1794540880522.jpg"),
  "pittosporum-variegated": path.join(BRAIN_DIR, "v2_pittosporum_variegated_1794540892714.jpg"),
};

function clamp(v, lo = 0, hi = 255) {
  return Math.max(lo, Math.min(hi, v));
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rp = 0,
    gp = 0,
    bp = 0;
  if (h < 60) [rp, gp, bp] = [c, x, 0];
  else if (h < 120) [rp, gp, bp] = [x, c, 0];
  else if (h < 180) [rp, gp, bp] = [0, c, x];
  else if (h < 240) [rp, gp, bp] = [0, x, c];
  else if (h < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  return [
    Math.round((rp + m) * 255),
    Math.round((gp + m) * 255),
    Math.round((bp + m) * 255),
  ];
}

/**
 * Clean dual-pass background removal:
 * 1) Border flood-fill with gradient-tolerant neutral threshold sweeps away corner vignette cleanly.
 * 2) Chroma-boosted studio keying strips interior holes cleanly without touching pale petals or foliage.
 */
async function extractStudioPhotoBuffer(inPath, options = {}) {
  const { mode = "neutral-grey", tLow = 22, tHigh = 42 } = options;
  const { data, info } = await sharp(inPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const total = width * height;

  let rSum = 0,
    gSum = 0,
    bSum = 0,
    n = 0;
  for (let y = 0; y < 24; y += 1) {
    for (let x = 0; x < 24; x += 1) {
      for (const px of [x, width - 1 - x]) {
        for (const py of [y, height - 1 - y]) {
          const o = (py * width + px) * 4;
          rSum += data[o];
          gSum += data[o + 1];
          bSum += data[o + 2];
          n += 1;
        }
      }
    }
  }
  const bgR = rSum / n;
  const bgG = gSum / n;
  const bgB = bSum / n;
  const bgMag = Math.max(1, Math.hypot(bgR, bgG, bgB));
  const bgRN = bgR / bgMag;
  const bgGN = bgG / bgMag;
  const bgBN = bgB / bgMag;

  const bgGreenBias = Math.max(0, bgG - (bgR + bgB) * 0.5);
  const bgWarmBias = Math.max(0, bgR - bgB);
  const bgBlueBias = Math.max(0, bgB - bgR);

  /**
   * Shadow-invariant chromaticity + lightness score against seamless studio backdrop:
   * Cast shadows & corner vignettes darken studio paper proportionally (tiny chromaticity angle error!)
   * while pale pink petals, blue hydrangeas & foliage diverge strongly in background-relative chroma.
   */
  const studioMatchDist = (r, g, b) => {
    const mag = Math.max(12, Math.hypot(r, g, b));
    const scale = mag / bgMag;
    const chromaAngle =
      Math.hypot(r / mag - bgRN, g / mag - bgGN, b / mag - bgBN) * 280;
    const shadowAwareLumaDiff =
      mag < bgMag ? Math.max(0, bgMag - mag - 155) * 0.14 : (mag - bgMag) * 0.3;
    // Background-relative foliage, blush/crimson/gold, and blue petal protection
    const greenEx = Math.max(0, g - (r + b) * 0.5 - bgGreenBias * scale);
    const roseEx = Math.max(0, r - b - bgWarmBias * scale);
    const blueEx = Math.max(0, b - r - bgBlueBias * scale);
    const maxChromaEx = Math.max(greenEx * 1.4, roseEx * 0.95, blueEx * 1.15);
    return chromaAngle * 0.85 + shadowAwareLumaDiff + maxChromaEx * 0.65;
  };

  const out = Buffer.from(data);

  // Pass 1: Perimeter flood-fill using shadow-invariant studio match distance
  const visited = new Uint8Array(total);
  const floodBg = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0,
    tail = 0;

  const bgLuma = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;

  const isOuterSeamless = (idx) => {
    const o = idx * 4;
    const r = data[o],
      g = data[o + 1],
      b = data[o + 2];
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    if (mode === "white-flood") {
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      return luma >= 218 && chroma <= 16;
    }
    // Backdrop is strictly uniform studio grey (bgLuma ~ 133).
    // Pale white petals (luma > 168) or deep green foliage (luma < 96) are strictly excluded from background flood!
    if (Math.abs(luma - bgLuma) > 28) {
      return false;
    }
    // Glaucous green foliage (e.g. eucalyptus) or warm petals are strictly excluded!
    if ((g - r > 7 && g - b > 3) || (r - g > 12 && r - b > 10)) {
      return false;
    }
    return studioMatchDist(r, g, b) < 36;
  };

  for (let x = 0; x < width; x += 1) {
    for (const idx of [x, (height - 1) * width + x]) {
      if (!visited[idx] && isOuterSeamless(idx)) {
        visited[idx] = 1;
        floodBg[idx] = 1;
        queue[tail++] = idx;
      }
    }
  }
  for (let y = 1; y < height - 1; y += 1) {
    for (const idx of [y * width, y * width + (width - 1)]) {
      if (!visited[idx] && isOuterSeamless(idx)) {
        visited[idx] = 1;
        floodBg[idx] = 1;
        queue[tail++] = idx;
      }
    }
  }

  while (head < tail) {
    const cur = queue[head++];
    const x = cur % width;
    const y = (cur - x) / width;
    const nbs = [
      x > 0 ? cur - 1 : -1,
      x + 1 < width ? cur + 1 : -1,
      y > 0 ? cur - width : -1,
      y + 1 < height ? cur + width : -1,
    ];
    for (const nb of nbs) {
      if (nb >= 0 && !visited[nb]) {
        visited[nb] = 1;
        if (isOuterSeamless(nb)) {
          floodBg[nb] = 1;
          queue[tail++] = nb;
        }
      }
    }
  }

  // Pass 2: Crisp edge defringing and near-perimeter keying (protects solid white/grey interior petals)
  for (let i = 0; i < total; i += 1) {
    if (floodBg[i]) {
      out[i * 4 + 3] = 0;
      continue;
    }

    const o = i * 4;
    const r = data[o],
      g = data[o + 1],
      b = data[o + 2];

    const x = i % width,
      y = (i - x) / width;
    let hasBgNeighbor = false;
    for (let dy = -3; dy <= 3 && !hasBgNeighbor; dy += 1) {
      for (let dx = -3; dx <= 3 && !hasBgNeighbor; dx += 1) {
        const nx = x + dx,
          ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height && floodBg[ny * width + nx]) {
          hasBgNeighbor = true;
        }
      }
    }

    if (mode === "white-flood") {
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      if (hasBgNeighbor && luma > 206 && chroma < 22) {
        const a = clamp(1 - ((luma - 206) / 48), 0.12, 1);
        out[o + 3] = Math.round(a * 255);
      }
    } else {
      const effDist = studioMatchDist(r, g, b);

      if (hasBgNeighbor) {
        if (effDist <= tLow) {
          out[o + 3] = 0;
        } else if (effDist < tHigh) {
          const a = (effDist - tLow) / (tHigh - tLow);
          const smoothA = a * a * (3 - 2 * a);
          out[o + 3] = Math.round(smoothA * 255);
          if (smoothA > 0.12) {
            const inv = 1 / smoothA;
            out[o] = clamp(Math.round((r - (1 - smoothA) * bgR) * inv));
            out[o + 1] = clamp(Math.round((g - (1 - smoothA) * bgG) * inv));
            out[o + 2] = clamp(Math.round((b - (1 - smoothA) * bgB) * inv));
          }
        }
      } else if (effDist < 15) {
        // Only transparent if exceptionally close match to seamless grey deep inside
        out[o + 3] = 0;
      }
    }
  }

  // Cleanup stray micro-dots AND discard detached corner speckle islands via BFS connected components
  for (let i = 0; i < total; i += 1) {
    if (out[i * 4 + 3] < 28) out[i * 4 + 3] = 0;
  }

  const compId = new Int32Array(total).fill(-1);
  const compSizes = [];
  const bfsQueue = new Int32Array(total);
  for (let i = 0; i < total; i += 1) {
    if (out[i * 4 + 3] === 0 || compId[i] >= 0) continue;
    const cid = compSizes.length;
    let cHead = 0,
      cTail = 0;
    compId[i] = cid;
    bfsQueue[cTail++] = i;
    while (cHead < cTail) {
      const cur = bfsQueue[cHead++];
      const x = cur % width;
      const y = (cur - x) / width;
      const nbs = [
        x > 0 ? cur - 1 : -1,
        x + 1 < width ? cur + 1 : -1,
        y > 0 ? cur - width : -1,
        y + 1 < height ? cur + width : -1,
      ];
      for (const nb of nbs) {
        if (nb >= 0 && compId[nb] < 0 && out[nb * 4 + 3] > 0) {
          compId[nb] = cid;
          bfsQueue[cTail++] = nb;
        }
      }
    }
    compSizes.push(cTail);
  }
  const maxComp = Math.max(1, ...compSizes);
  const minKeepSize = Math.max(180, Math.round(maxComp * 0.004));
  for (let i = 0; i < total; i += 1) {
    const cid = compId[i];
    if (cid >= 0 && compSizes[cid] < minKeepSize) {
      out[i * 4 + 3] = 0;
    }
  }

  return { buffer: out, width, height };
}

function measureForegroundBounds(rawRgba, width, height, alphaThresh = 128) {
  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (rawRgba[(y * width + x) * 4 + 3] >= alphaThresh) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/**
 * Smooth pixel-level horizontal curve displacement (zero staircase steps!).
 */
function warpCurveBilinear(rawRgba, width, height, curveXOffset) {
  if (Math.abs(curveXOffset) < 1) return { buffer: rawRgba, width, height };
  const out = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const t = 1 - y / Math.max(1, height - 1);
    const shiftX = curveXOffset * Math.pow(t, 1.55);
    for (let x = 0; x < width; x += 1) {
      const sx = x - shiftX;
      if (sx < 0 || sx >= width - 1) continue;
      const x0 = Math.floor(sx);
      const fx = sx - x0;
      const o0 = (y * width + x0) * 4;
      const o1 = (y * width + x0 + 1) * 4;
      const do0 = (y * width + x) * 4;
      out[do0] = Math.round(rawRgba[o0] * (1 - fx) + rawRgba[o1] * fx);
      out[do0 + 1] = Math.round(rawRgba[o0 + 1] * (1 - fx) + rawRgba[o1 + 1] * fx);
      out[do0 + 2] = Math.round(rawRgba[o0 + 2] * (1 - fx) + rawRgba[o1 + 2] * fx);
      out[do0 + 3] = Math.round(rawRgba[o0 + 3] * (1 - fx) + rawRgba[o1 + 3] * fx);
    }
  }
  return { buffer: out, width, height };
}

/**
 * Align extracted stem cleanly onto 840x1400 master canvas with seamless bottom stem extension.
 */
async function composeStandardStemMaster(rawObj, skuId, options = {}) {
  const W = WORLD_MASTER_ASPECT.stemWidthPx;
  const H = WORLD_MASTER_ASPECT.stemHeightPx;
  const {
    targetHeadWidthRatio = 0.56,
    rotateDeg = 0,
    extendStem = true,
    scaleMultiplier = 1,
    curveXOffset = 0,
    skewBloomX = 1,
    skewBloomY = 1,
  } = options;

  let workingBuf = await sharp(rawObj.buffer, {
    raw: { width: rawObj.width, height: rawObj.height, channels: 4 },
  })
    .png()
    .toBuffer();

  if (rotateDeg !== 0) {
    workingBuf = await sharp(workingBuf)
      .rotate(rotateDeg, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
  }

  let { data: fgData, info: fgInfo } = await sharp(workingBuf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (Math.abs(curveXOffset) >= 1) {
    const warped = warpCurveBilinear(fgData, fgInfo.width, fgInfo.height, curveXOffset);
    fgData = warped.buffer;
    workingBuf = await sharp(fgData, {
      raw: { width: fgInfo.width, height: fgInfo.height, channels: 4 },
    })
      .png()
      .toBuffer();
  }

  const bounds = measureForegroundBounds(fgData, fgInfo.width, fgInfo.height, 130);
  if (bounds.w <= 1 || bounds.h <= 1) {
    throw new Error(`Empty foreground for ${skuId}`);
  }

  const croppedBuf = await sharp(workingBuf)
    .extract({ left: bounds.minX, top: bounds.minY, width: bounds.w, height: bounds.h })
    .png()
    .toBuffer();

  // Compute upper 40% bloom horizontal centroid & crown width
  const upperStopY = Math.round(bounds.h * 0.40);
  let sumX = 0,
    sumW = 0,
    crownMinX = bounds.w,
    crownMaxX = 0;
  for (let y = 0; y < upperStopY; y += 1) {
    for (let x = 0; x < bounds.w; x += 1) {
      const a = fgData[((bounds.minY + y) * fgInfo.width + (bounds.minX + x)) * 4 + 3];
      if (a > 110) {
        sumX += x * a;
        sumW += a;
        if (x < crownMinX) crownMinX = x;
        if (x > crownMaxX) crownMaxX = x;
      }
    }
  }
  const crownCenterX = sumW > 0 ? sumX / sumW : bounds.w / 2;
  const crownWidth = Math.max(120, crownMaxX - crownMinX + 1);

  // Measure EXACT lowest opaque stem coordinates by scanning from bottom upward for a clean dense stem row
  let botStemRelY = bounds.h - 4;
  for (let y = bounds.h - 1; y >= Math.floor(bounds.h * 0.55); y -= 1) {
    let rowCount = 0;
    for (let x = 0; x < bounds.w; x += 1) {
      if (fgData[((bounds.minY + y) * fgInfo.width + (bounds.minX + x)) * 4 + 3] > 200) {
        rowCount += 1;
      }
    }
    if (rowCount >= 4) {
      botStemRelY = y;
      break;
    }
  }
  let tipXSum = 0,
    tipW = 0,
    tipMinX = bounds.w,
    tipMaxX = 0;
  let upperStemXSum = 0,
    upperStemW = 0;
  const stemColors = [];
  const tipStart = Math.max(0, botStemRelY - 14);
  const tipEnd = Math.min(bounds.h, botStemRelY + 1);
  const slopeStart = Math.max(0, botStemRelY - 42);
  for (let y = slopeStart; y < tipEnd; y += 1) {
    for (let x = 0; x < bounds.w; x += 1) {
      const o = ((bounds.minY + y) * fgInfo.width + (bounds.minX + x)) * 4;
      const r = fgData[o],
        g = fgData[o + 1],
        b = fgData[o + 2],
        a = fgData[o + 3];
      if (a > 200) {
        if (y < tipStart) {
          upperStemXSum += x * a;
          upperStemW += a;
        } else {
          tipXSum += x * a;
          tipW += a;
          if (x < tipMinX) tipMinX = x;
          if (x > tipMaxX) tipMaxX = x;
          if (g >= r - 12 && g >= b - 4 && r + g + b > 95) {
            stemColors.push([r, g, b]);
          }
        }
      }
    }
  }
  const botStemRelX = tipW > 0 ? tipXSum / tipW : crownCenterX;
  const upperStemRelX = upperStemW > 0 ? upperStemXSum / upperStemW : botStemRelX;
  const stemDX = botStemRelX - upperStemRelX;
  const botStemHalfW = tipMaxX >= tipMinX ? clamp((tipMaxX - tipMinX + 1) * 0.42, 3.2, 8.2) : 5.8;
  let botR = 84,
    botG = 120,
    botB = 56;
  if (stemColors.length > 0) {
    stemColors.sort((a, b) => a[1] - b[1]);
    const mid = stemColors[Math.floor(stemColors.length * 0.44)];
    botR = mid[0];
    botG = mid[1];
    botB = mid[2];
  }

  const desiredCrownPx = W * targetHeadWidthRatio * scaleMultiplier;
  let scale = desiredCrownPx / crownWidth;
  const maxHeightScale = 1140 / bounds.h;
  if (scale > maxHeightScale && options.allowTallScale !== true) {
    scale = Math.min(scale, maxHeightScale * 1.06);
  }
  scale = Math.max(0.45, Math.min(1.75, scale));

  const drawW = Math.round(bounds.w * scale * skewBloomX);
  const drawH = Math.round(bounds.h * scale * skewBloomY);
  const crownOffsetScaledX = crownCenterX * scale * skewBloomX;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const img = await loadImage(croppedBuf);

  const targetAnchorY = H * WORLD_MASTER_ASPECT.stemAnchorY; // 308
  const headCenterInCropY = Math.min(bounds.h * 0.25, crownWidth * 0.52);
  let destY = Math.round(targetAnchorY - headCenterInCropY * scale * skewBloomY);
  destY = Math.max(22, Math.min(230, destY));
  const destX = Math.round(W / 2 - crownOffsetScaledX);

  ctx.drawImage(img, destX, destY, drawW, drawH);

  // Seamless stem continuation overlapping existing photographed stalk cleanly down to y=1388
  const tipWorldY = destY + Math.round((botStemRelY - 3) * scale * skewBloomY);
  const tipWorldX = destX + botStemRelX * scale * skewBloomX;

  if (extendStem && tipWorldY < 1375) {
    const startExtY = Math.max(destY + 120, tipWorldY - 18);
    const targetExtY = 1388;
    const stemRad = Math.max(3.2, Math.min(8.2, botStemHalfW * scale * skewBloomX * 0.94));
    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    const slopeTargetX = tipWorldX + stemDX * scale * 2.2;
    const endX = slopeTargetX * 0.5 + (W / 2) * 0.5;
    const grad = ctx.createLinearGradient(tipWorldX - stemRad, startExtY, tipWorldX + stemRad, startExtY);
    grad.addColorStop(0, `rgb(${clamp(botR - 22)},${clamp(botG - 22)},${clamp(botB - 14)})`);
    grad.addColorStop(0.36, `rgb(${clamp(botR + 10)},${clamp(botG + 11)},${clamp(botB + 8)})`);
    grad.addColorStop(0.85, `rgb(${botR},${botG},${botB})`);
    grad.addColorStop(1, `rgb(${clamp(botR - 24)},${clamp(botG - 24)},${clamp(botB - 16)})`);
    ctx.strokeStyle = grad;
    ctx.lineCap = "round";
    ctx.lineWidth = stemRad * 2;
    ctx.beginPath();
    ctx.moveTo(tipWorldX, startExtY);
    ctx.quadraticCurveTo(
      tipWorldX + stemDX * scale * 0.85,
      (startExtY + targetExtY) * 0.5,
      endX,
      targetExtY,
    );
    ctx.stroke();
    ctx.restore();
  }

  const outPath = path.join(OUT_FLOWERS, `${skuId}.png`);
  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
  return outPath;
}

/**
 * Only recolors high-confidence opaque pixels (a >= 95), preventing vignette halo tinting!
 */
function recolorPetalsInRgba(rawObj, filterFn, mapFn) {
  const out = Buffer.from(rawObj.buffer);
  for (let i = 0; i < out.length; i += 4) {
    const a = out[i + 3];
    if (a < 95) continue;
    const r = out[i],
      g = out[i + 1],
      b = out[i + 2];
    if (filterFn(r, g, b)) {
      const [nr, ng, nb] = mapFn(r, g, b);
      out[i] = clamp(nr);
      out[i + 1] = clamp(ng);
      out[i + 2] = clamp(nb);
    }
  }
  return { buffer: out, width: rawObj.width, height: rawObj.height };
}

async function createRealLoosePetal(rawObj, skuId, cropFrac, warmShift = [0, 0, 0]) {
  const S = WORLD_MASTER_ASPECT.petalSizePx;
  const cx0 = Math.round(rawObj.width * cropFrac.x);
  const cy0 = Math.round(rawObj.height * cropFrac.y);
  const cw = Math.round(rawObj.width * cropFrac.w);
  const ch = Math.round(rawObj.height * cropFrac.h);

  // Softly blur micro-patch into pure velvety single-petal tonal sheen (no mini entire rose inside a single petal!)
  const patch = await sharp(rawObj.buffer, {
    raw: { width: rawObj.width, height: rawObj.height, channels: 4 },
  })
    .extract({ left: cx0, top: cy0, width: cw, height: ch })
    .resize(260, 320, { fit: "cover" })
    .blur(4.5)
    .resize(480, 560, { fit: "fill" })
    .png()
    .toBuffer();

  const canvas = createCanvas(S, S);
  const ctx = canvas.getContext("2d");
  const img = await loadImage(patch);

  ctx.save();
  ctx.translate(S / 2, S / 2);
  ctx.rotate(-0.16);
  ctx.beginPath();
  ctx.moveTo(0, 205);
  ctx.bezierCurveTo(-190, 160, -210, -45, -130, -180);
  ctx.bezierCurveTo(-45, -240, 55, -235, 134, -170);
  ctx.bezierCurveTo(210, -35, 180, 155, 0, 205);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, -240, -280, 480, 560);

  const rimGrad = ctx.createRadialGradient(-20, 10, 40, 0, 0, 240);
  rimGrad.addColorStop(0, "rgba(255,248,249,0)");
  rimGrad.addColorStop(0.84, "rgba(180,100,115,0.08)");
  rimGrad.addColorStop(1, "rgba(115,58,70,0.24)");
  ctx.fillStyle = rimGrad;
  ctx.fillRect(-260, -280, 520, 560);
  ctx.restore();

  if (warmShift[0] || warmShift[1] || warmShift[2]) {
    const imgData = ctx.getImageData(0, 0, S, S);
    for (let i = 0; i < imgData.data.length; i += 4) {
      if (imgData.data[i + 3] > 20) {
        imgData.data[i] = clamp(imgData.data[i] + warmShift[0]);
        imgData.data[i + 1] = clamp(imgData.data[i + 1] + warmShift[1]);
        imgData.data[i + 2] = clamp(imgData.data[i + 2] + warmShift[2]);
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  fs.writeFileSync(path.join(OUT_FLOWERS, `${skuId}.png`), canvas.toBuffer("image/png"));
}

async function main() {
  fs.mkdirSync(OUT_FLOWERS, { recursive: true });

  console.log("1/4 Extracting clean studio botanical cutouts...");
  const cutouts = {
    babysBreath: await extractStudioPhotoBuffer(REAL_PHOTOS["babys-breath"], { mode: "neutral-grey", tLow: 20, tHigh: 42 }),
    roseCrimson: await extractStudioPhotoBuffer(REAL_PHOTOS["rose-crimson-open"], { mode: "neutral-grey", tLow: 22, tHigh: 44 }),
    roseBlush: await extractStudioPhotoBuffer(REAL_PHOTOS["rose-blush-open"], { mode: "neutral-grey", tLow: 22, tHigh: 44 }),
    roseApricot: await extractStudioPhotoBuffer(REAL_PHOTOS["rose-probe-apricot"], { mode: "white-flood" }),
    peonyBlushFull: await extractStudioPhotoBuffer(REAL_PHOTOS["peony-blush-full"], { mode: "neutral-grey", tLow: 20, tHigh: 42 }),
    peonyBlushSmall: await extractStudioPhotoBuffer(REAL_PHOTOS["peony-blush-small"], { mode: "neutral-grey", tLow: 20, tHigh: 42 }),
    peonyCoralFull: await extractStudioPhotoBuffer(REAL_PHOTOS["peony-coral-full"], { mode: "neutral-grey", tLow: 22, tHigh: 44 }),
    tulipBlush: await extractStudioPhotoBuffer(REAL_PHOTOS["tulip-blush-upright"], { mode: "neutral-grey", tLow: 20, tHigh: 42 }),
    sunflowerFront: await extractStudioPhotoBuffer(REAL_PHOTOS["sunflower-front"], { mode: "neutral-grey", tLow: 22, tHigh: 44 }),
    hydrangeaBlue: await extractStudioPhotoBuffer(REAL_PHOTOS["hydrangea-blue"], { mode: "neutral-grey", tLow: 22, tHigh: 38 }),
    ranunculusPeach: await extractStudioPhotoBuffer(REAL_PHOTOS["ranunculus-peach"], { mode: "neutral-grey", tLow: 20, tHigh: 42 }),
    meadowAster: await extractStudioPhotoBuffer(REAL_PHOTOS["meadow-aster"], { mode: "neutral-grey", tLow: 29, tHigh: 48 }),
    pineSprig: await extractStudioPhotoBuffer(REAL_PHOTOS["pine-sprig"], { mode: "neutral-grey", tLow: 20, tHigh: 40 }),
    // New fine-art florist studio cutouts
    carnationBlush: await extractStudioPhotoBuffer(REAL_PHOTOS["carnation-blush"], { mode: "neutral-grey", tLow: 22, tHigh: 44 }),
    camelliaWhite: await extractStudioPhotoBuffer(REAL_PHOTOS["camellia-white"], { mode: "neutral-grey", tLow: 22, tHigh: 42 }),
    zinniaAmber: await extractStudioPhotoBuffer(REAL_PHOTOS["zinnia-amber"], { mode: "neutral-grey", tLow: 22, tHigh: 44 }),
    magnoliaIvory: await extractStudioPhotoBuffer(REAL_PHOTOS["magnolia-ivory"], { mode: "neutral-grey", tLow: 22, tHigh: 42 }),
    dahliaBurgundy: await extractStudioPhotoBuffer(REAL_PHOTOS["dahlia-burgundy"], { mode: "neutral-grey", tLow: 22, tHigh: 44 }),
    anemoneBlush: await extractStudioPhotoBuffer(REAL_PHOTOS["anemone-blush"], { mode: "neutral-grey", tLow: 22, tHigh: 42 }),
    eucalyptusSilver: await extractStudioPhotoBuffer(REAL_PHOTOS["eucalyptus-silver"], { mode: "neutral-grey", tLow: 20, tHigh: 40 }),
    eucalyptusSeeded: await extractStudioPhotoBuffer(REAL_PHOTOS["eucalyptus-seeded"], { mode: "neutral-grey", tLow: 20, tHigh: 40 }),
    ruscusItalian: await extractStudioPhotoBuffer(REAL_PHOTOS["ruscus-italian"], { mode: "neutral-grey", tLow: 20, tHigh: 40 }),
    oliveBranch: await extractStudioPhotoBuffer(REAL_PHOTOS["olive-branch"], { mode: "neutral-grey", tLow: 20, tHigh: 40 }),
    leatherleafFern: await extractStudioPhotoBuffer(REAL_PHOTOS["leatherleaf-fern"], { mode: "neutral-grey", tLow: 20, tHigh: 40 }),
    salalLemonLeaf: await extractStudioPhotoBuffer(REAL_PHOTOS["salal-lemon-leaf"], { mode: "neutral-grey", tLow: 20, tHigh: 40 }),
    pittosporumVariegated: await extractStudioPhotoBuffer(REAL_PHOTOS["pittosporum-variegated"], { mode: "neutral-grey", tLow: 20, tHigh: 40 }),
  };

  console.log("2/4 Composing direct studio photograph masters...");
  await composeStandardStemMaster(cutouts.babysBreath, "babys-breath", { targetHeadWidthRatio: 0.72 });
  await composeStandardStemMaster(cutouts.roseCrimson, "rose-crimson-open", { targetHeadWidthRatio: 0.56 });
  await composeStandardStemMaster(cutouts.roseBlush, "rose-blush-open", { targetHeadWidthRatio: 0.56 });
  await composeStandardStemMaster(cutouts.peonyBlushFull, "peony-blush-full", { targetHeadWidthRatio: 0.62 });
  await composeStandardStemMaster(cutouts.peonyBlushSmall, "peony-blush-small", { targetHeadWidthRatio: 0.48 });
  await composeStandardStemMaster(cutouts.peonyCoralFull, "peony-coral-full", { targetHeadWidthRatio: 0.60 });
  await composeStandardStemMaster(cutouts.tulipBlush, "tulip-blush-upright", { targetHeadWidthRatio: 0.45 });
  await composeStandardStemMaster(cutouts.sunflowerFront, "sunflower-front", { targetHeadWidthRatio: 0.64 });
  await composeStandardStemMaster(cutouts.hydrangeaBlue, "hydrangea-blue", { targetHeadWidthRatio: 0.68 });
  await composeStandardStemMaster(cutouts.ranunculusPeach, "ranunculus-peach", { targetHeadWidthRatio: 0.52 });
  await composeStandardStemMaster(cutouts.meadowAster, "meadow-aster", { targetHeadWidthRatio: 0.68 });
  await composeStandardStemMaster(cutouts.pineSprig, "pine-sprig", {
    rotateDeg: -62,
    targetHeadWidthRatio: 0.66,
    extendStem: true,
  });

  // Direct composition of newly generated fine-art florist studio masters
  await composeStandardStemMaster(cutouts.carnationBlush, "carnation-blush", { targetHeadWidthRatio: 0.52 });
  await composeStandardStemMaster(cutouts.camelliaWhite, "camellia-white", { targetHeadWidthRatio: 0.54 });
  await composeStandardStemMaster(cutouts.zinniaAmber, "zinnia-amber", { targetHeadWidthRatio: 0.55 });
  await composeStandardStemMaster(cutouts.magnoliaIvory, "magnolia-ivory", { targetHeadWidthRatio: 0.58 });
  await composeStandardStemMaster(cutouts.dahliaBurgundy, "dahlia-burgundy", { targetHeadWidthRatio: 0.52 });
  await composeStandardStemMaster(cutouts.anemoneBlush, "anemone-blush", { targetHeadWidthRatio: 0.50 });
  await composeStandardStemMaster(cutouts.eucalyptusSilver, "eucalyptus-silver", { targetHeadWidthRatio: 0.46 });
  await composeStandardStemMaster(cutouts.eucalyptusSeeded, "eucalyptus-seeded", { targetHeadWidthRatio: 0.48 });
  await composeStandardStemMaster(cutouts.ruscusItalian, "ruscus-italian", { targetHeadWidthRatio: 0.42 });
  await composeStandardStemMaster(cutouts.oliveBranch, "olive-branch", { targetHeadWidthRatio: 0.48 });
  await composeStandardStemMaster(cutouts.leatherleafFern, "leatherleaf-fern", { targetHeadWidthRatio: 0.65 });
  await composeStandardStemMaster(cutouts.leatherleafFern, "fern-boston", { targetHeadWidthRatio: 0.65 });
  await composeStandardStemMaster(cutouts.salalLemonLeaf, "salal-lemon-leaf", { targetHeadWidthRatio: 0.52 });
  await composeStandardStemMaster(cutouts.pittosporumVariegated, "pittosporum-variegated", { targetHeadWidthRatio: 0.52 });

  console.log("3/4 Synthesizing clean photographic botanical variants...");
  const isNonGreenBloom = (r, g, b) => g <= Math.max(r, b) + 6 && r + b > 70;

  const roseWhite = recolorPetalsInRgba(cutouts.roseBlush, isNonGreenBloom, (r, g, b) => {
    const luma = 0.3 * r + 0.59 * g + 0.11 * b;
    const lifted = Math.min(252, luma * 0.65 + 94);
    return [Math.round(lifted * 1.01), Math.round(lifted * 0.99), Math.round(lifted * 0.94)];
  });
  await composeStandardStemMaster(roseWhite, "rose-white-open", { targetHeadWidthRatio: 0.56 });

  const rosePeach = recolorPetalsInRgba(cutouts.roseBlush, isNonGreenBloom, (r, g, b) => {
    const [h, s, l] = rgbToHsl(r, g, b);
    const nextH = h > 300 || h < 50 ? 22 : h;
    const nextS = Math.min(0.86, Math.max(0.28, s * 1.45));
    return hslToRgb(nextH, nextS, Math.min(0.92, l * 0.96));
  });
  await composeStandardStemMaster(rosePeach, "rose-peach-open", { targetHeadWidthRatio: 0.55 });

  const softBlushGoblet = recolorPetalsInRgba(
    cutouts.roseApricot,
    (r, g, b) => r > g + 8 && r > 120,
    (r, g, b) => {
      const [h, s, l] = rgbToHsl(r, g, b);
      return hslToRgb(350, Math.min(0.68, s * 0.92), Math.min(0.92, l * 1.02));
    },
  );
  await composeStandardStemMaster(softBlushGoblet, "rose-blush-half", {
    targetHeadWidthRatio: 0.44,
    skewBloomX: 0.84,
    skewBloomY: 1.06,
  });
  await composeStandardStemMaster(cutouts.peonyBlushSmall, "rose-blush-bud", {
    targetHeadWidthRatio: 0.32,
    skewBloomX: 0.62,
    skewBloomY: 1.12,
  });

  // Rich shaded crimson tulip (preserving highlight sheen and petal crevice tonal contrast)
  const tulipRed = recolorPetalsInRgba(
    cutouts.tulipBlush,
    (r, g, b) => r > g - 2 && r > 130 && r - b >= -8,
    (r, g, b) => {
      const t = clamp((0.3 * r + 0.59 * g + 0.11 * b - 115) / 140, 0, 1);
      return [
        Math.round(72 + t * 155),
        Math.round(10 + Math.pow(t, 1.8) * 58),
        Math.round(20 + Math.pow(t, 1.8) * 66),
      ];
    },
  );
  await composeStandardStemMaster(tulipRed, "tulip-red-upright", { targetHeadWidthRatio: 0.44 });
  await composeStandardStemMaster(tulipRed, "tulip-red-tilted", {
    targetHeadWidthRatio: 0.44,
    curveXOffset: 86,
  });

  const tulipYellow = recolorPetalsInRgba(
    cutouts.tulipBlush,
    (r, g, b) => r > g - 2 && r > 130 && r - b >= -8,
    (r, g, b) => {
      const t = clamp((0.3 * r + 0.59 * g + 0.11 * b - 115) / 140, 0, 1);
      return [
        Math.round(178 + t * 76),
        Math.round(115 + t * 108),
        Math.round(14 + Math.pow(t, 2) * 72),
      ];
    },
  );
  await composeStandardStemMaster(tulipYellow, "tulip-yellow-tilted", {
    targetHeadWidthRatio: 0.44,
    curveXOffset: -84,
  });

  await composeStandardStemMaster(cutouts.sunflowerFront, "sunflower-angled", {
    targetHeadWidthRatio: 0.56,
    skewBloomX: 0.80,
    curveXOffset: 44,
  });

  const chamomileCutout = recolorPetalsInRgba(
    cutouts.meadowAster,
    (r, g, b) => b > g + 8 && b > r - 12 && r + g + b > 260,
    (r, g, b) => {
      const l = Math.min(252, Math.max(216, (r + g + b) / 3 + 50));
      return [Math.round(l * 1.0), Math.round(l * 0.99), Math.round(l * 0.96)];
    },
  );
  await composeStandardStemMaster(chamomileCutout, "daisy-chamomile", { targetHeadWidthRatio: 0.66 });

  const waxflowerCutout = recolorPetalsInRgba(
    cutouts.meadowAster,
    (r, g, b) => b > g + 8 && b > r - 12 && r + g + b > 250,
    (r, g, b) => {
      const l = Math.min(248, (r + g + b) / 3 + 42);
      return [Math.round(l * 1.02), Math.round(l * 0.80), Math.round(l * 0.86)];
    },
  );
  await composeStandardStemMaster(waxflowerCutout, "waxflower", { targetHeadWidthRatio: 0.60 });

  console.log("4/4 Cropping 100% real macro blush petals & seed textures...");
  await createRealLoosePetal(cutouts.roseBlush, "rose-petal-blush", { x: 0.36, y: 0.14, w: 0.14, h: 0.10 });
  await createRealLoosePetal(cutouts.peonyBlushFull, "peony-petal-blush", { x: 0.36, y: 0.20, w: 0.16, h: 0.12 }, [6, -2, 0]);

  const texDir = path.join(ROOT, "assets-master", "_textures");
  fs.mkdirSync(texDir, { recursive: true });
  await sharp(cutouts.roseCrimson.buffer, {
    raw: { width: cutouts.roseCrimson.width, height: cutouts.roseCrimson.height, channels: 4 },
  })
    .extract({
      left: Math.round(cutouts.roseCrimson.width * 0.62),
      top: Math.round(cutouts.roseCrimson.height * 0.52),
      width: 140,
      height: 110,
    })
    .png()
    .toFile(path.join(texDir, "real-leaf-veins.png"));

  await sharp(cutouts.peonyBlushFull.buffer, {
    raw: { width: cutouts.peonyBlushFull.width, height: cutouts.peonyBlushFull.height, channels: 4 },
  })
    .extract({
      left: Math.round(cutouts.peonyBlushFull.width * 0.38),
      top: Math.round(cutouts.peonyBlushFull.height * 0.32),
      width: 160,
      height: 140,
    })
    .png()
    .toFile(path.join(texDir, "real-petal-grain.png"));

  console.log("Done: 22 clean photo botanical masters ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
