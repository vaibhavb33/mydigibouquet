import fs from "node:fs";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import {
  BOTANICAL_SPECS,
  BOW_STYLE_LIST,
  RIBBON_FINISH_LIST,
  RIBBON_PALETTES,
  VESSEL_VISUAL_SPECS,
  WORLD_MASTER_ASPECT,
} from "./catalog-data.mjs";

const ROOT = process.cwd();
const MASTER_ROOT = path.join(ROOT, "assets-master");
const PHOTO_MASTER_SKUS = new Set([
  "babys-breath",
  "rose-crimson-open",
  "rose-blush-open",
  "rose-white-open",
  "rose-peach-open",
  "rose-blush-half",
  "rose-blush-bud",
  "rose-petal-blush",
  "peony-blush-full",
  "peony-blush-small",
  "peony-coral-full",
  "peony-petal-blush",
  "tulip-blush-upright",
  "tulip-red-upright",
  "tulip-red-tilted",
  "tulip-yellow-tilted",
  "sunflower-front",
  "sunflower-angled",
  "hydrangea-blue",
  "ranunculus-peach",
  "meadow-aster",
  "daisy-chamomile",
  "waxflower",
  "pine-sprig",
  // Real studio photography masters
  "carnation-blush",
  "camellia-white",
  "zinnia-amber",
  "magnolia-ivory",
  "dahlia-burgundy",
  "anemone-blush",
  "eucalyptus-silver",
  "eucalyptus-seeded",
  "ruscus-italian",
  "olive-branch",
  "leatherleaf-fern",
  "salal-lemon-leaf",
  "pittosporum-variegated",
  "fern-boston",
]);

function seededRng(seedStr) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i += 1) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgba(hex, alpha = 1) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function clamp(v, lo = 0, hi = 255) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Adds tactile fibrous paper/clay/cotton micro-grain directly to opaque pixels of a canvas.
 */
function applyMaterialGrain(ctx, W, H, seed, opts = {}) {
  const { intensity = 10, weave = "paper", warmSpeckle = false } = opts;
  const imgData = ctx.getImageData(0, 0, W, H);
  const d = imgData.data;
  const rng = seededRng(seed);

  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const idx = (y * W + x) * 4;
      const a = d[idx + 3];
      if (a < 24) continue;

      let delta = (rng() - 0.5) * intensity * 2;
      if (weave === "linen" || weave === "cotton") {
        const warp = Math.sin(x * 0.9) * Math.sin(y * 0.9) * (intensity * 0.65);
        delta = delta * 0.6 + warp;
      } else if (weave === "herringbone") {
        const diag = ((x + y) % 18 < 9 ? 1 : -1) * Math.sin((x - y) * 0.45);
        delta += diag * intensity * 0.7;
      } else if (weave === "stoneware" || weave === "terracotta") {
        const speckle = rng() > 0.992 ? -28 : rng() > 0.994 ? 16 : 0;
        const lathe = Math.sin(y * 0.22) * 3.5;
        delta += speckle + lathe;
      } else if (weave === "kraft" && warmSpeckle) {
        if (rng() > 0.985) delta -= 22;
      }

      d[idx] = clamp(d[idx] + delta);
      d[idx + 1] = clamp(d[idx + 1] + delta * 0.96);
      d[idx + 2] = clamp(d[idx + 2] + delta * 0.92);
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

/**
 * Natural curved branching woody/herbaceous stalk.
 */
function drawNaturalStem(ctx, x0, y0, x1, y1, widthTop, widthBot, tone = "herbaceous", rng) {
  const c1x = x0 + (rng() - 0.5) * 34;
  const c1y = y0 + (y1 - y0) * 0.35;
  const c2x = x1 + (rng() - 0.5) * 26;
  const c2y = y0 + (y1 - y0) * 0.7;

  const grad = ctx.createLinearGradient(x0 - widthBot, y0, x0 + widthBot, y0);
  if (tone === "woody") {
    grad.addColorStop(0, "#493B2C");
    grad.addColorStop(0.38, "#7D6853");
    grad.addColorStop(0.72, "#62513E");
    grad.addColorStop(1, "#3B2F22");
  } else {
    grad.addColorStop(0, "#314925");
    grad.addColorStop(0.36, "#7A9B59");
    grad.addColorStop(0.75, "#507037");
    grad.addColorStop(1, "#2A3E20");
  }

  ctx.save();
  ctx.strokeStyle = grad;
  ctx.lineCap = "round";
  ctx.lineWidth = (widthTop + widthBot) * 0.5;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.bezierCurveTo(c1x, c1y, c2x, c2y, x1, y1);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw real leaf-textured botanical leaf with midrib ridge + subsurface highlight + optional frosted wool.
 */
function drawTexturedLeaf(ctx, leafPattern, cx, cy, angle, len, wid, pal, options = {}) {
  const { frosted = false, curved = 0.14, serrated = false } = options;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  if (serrated) {
    const steps = 7;
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      const py = -t * len;
      const w = Math.sin(t * Math.PI) * wid * (0.95 - t * 0.15);
      const notch = i < steps ? 5 : 0;
      ctx.lineTo(-w, py + notch);
      ctx.lineTo(-w * 0.88, py);
    }
    ctx.lineTo(0, -len * 1.02);
    for (let i = steps; i >= 1; i -= 1) {
      const t = i / steps;
      const py = -t * len;
      const w = Math.sin(t * Math.PI) * wid * (0.95 - t * 0.15);
      ctx.lineTo(w * 0.88, py);
      ctx.lineTo(w, py + 4);
    }
    ctx.closePath();
  } else {
    ctx.bezierCurveTo(-wid * 0.95, -len * 0.25, -wid * (1 + curved), -len * 0.72, 0, -len);
    ctx.bezierCurveTo(wid * (1 - curved * 0.5), -len * 0.72, wid * 0.95, -len * 0.25, 0, 0);
  }
  ctx.closePath();

  const grad = ctx.createLinearGradient(-wid, -len * 0.2, wid, -len * 0.85);
  grad.addColorStop(0, pal.mid);
  grad.addColorStop(0.5, pal.petal);
  grad.addColorStop(1, pal.deep);
  ctx.fillStyle = grad;
  ctx.fill();

  if (leafPattern) {
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = frosted ? 0.24 : 0.48;
    ctx.drawImage(leafPattern, -wid * 1.1, -len * 1.05, wid * 2.2, len * 1.1);
    ctx.restore();
  }

  // Rim sheen + crisp botanical midrib & secondary lateral veins
  ctx.strokeStyle = hexToRgba(pal.rim, frosted ? 0.55 : 0.35);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.quadraticCurveTo(wid * 0.08, -len * 0.5, 0, -len * 0.94);
  ctx.stroke();

  ctx.strokeStyle = hexToRgba(pal.deep, 0.28);
  ctx.lineWidth = 1;
  for (let v = 1; v <= 4; v += 1) {
    const t = v * 0.19;
    const vy = -t * len;
    const vw = Math.sin(t * Math.PI) * wid * 0.68;
    ctx.beginPath();
    ctx.moveTo(0, vy);
    ctx.quadraticCurveTo(-vw * 0.5, vy - 5, -vw, vy - 12);
    ctx.moveTo(0, vy);
    ctx.quadraticCurveTo(vw * 0.5, vy - 5, vw, vy - 12);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTexturedPetal(ctx, petalTex, rx, ry, pal, rng, curve = 0) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-rx * 0.92, -ry * 0.28, -rx * (1.06 + curve), -ry * 0.78, -rx * 0.25, -ry * 0.98);
  ctx.bezierCurveTo(0, -ry * 1.04, rx * 0.25, -ry * 0.98, rx * (1.06 - curve), -ry * 0.78);
  ctx.bezierCurveTo(rx * 0.92, -ry * 0.28, 0, 0, 0, 0);
  ctx.closePath();

  const grad = ctx.createRadialGradient(0, -ry * 0.16, 4, 0, -ry * 0.55, ry * 0.95);
  grad.addColorStop(0, pal.deep);
  grad.addColorStop(0.42, pal.mid);
  grad.addColorStop(0.82, pal.petal);
  grad.addColorStop(1, pal.rim);
  ctx.fillStyle = grad;
  ctx.fill();

  if (petalTex) {
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.28;
    ctx.drawImage(petalTex, -rx * 1.1, -ry * 1.05, rx * 2.2, ry * 1.1);
    ctx.restore();
  }

  ctx.strokeStyle = hexToRgba(pal.rim, 0.35);
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.restore();
}

async function generateRemainingBotanicals(leafTex, petalTex) {
  const outDir = path.join(MASTER_ROOT, "flowers");
  fs.mkdirSync(outDir, { recursive: true });
  const W = WORLD_MASTER_ASPECT.stemWidthPx;
  const H = WORLD_MASTER_ASPECT.stemHeightPx;
  const cx = W * WORLD_MASTER_ASPECT.stemAnchorX;
  const cy = H * WORLD_MASTER_ASPECT.stemAnchorY;

  for (const spec of BOTANICAL_SPECS) {
    if (PHOTO_MASTER_SKUS.has(spec.skuId)) continue;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");
    const rng = seededRng(spec.skuId);
    const pal = spec.palette;

    switch (spec.skuId) {
      case "eucalyptus-silver": {
        drawNaturalStem(ctx, cx - 12, 185, cx + 6, 1388, 18, 10, "woody", rng);
        for (let i = 0; i < 16; i += 1) {
          const t = i / 15;
          const sy = 190 + t * 575;
          const curveX = Math.sin(t * Math.PI * 1.15) * 16 - 4;
          const side = i % 2 === 0 ? -1 : 1;
          const rad = 48 - Math.abs(t - 0.44) * 26 + (rng() - 0.5) * 10;
          const lx = cx + curveX + side * (16 + (1 - t) * 10);
          // Delicate glaucous petiole twig connecting leaf to main stem
          ctx.strokeStyle = "#6F8376";
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(cx + curveX, sy + 12);
          ctx.lineTo(lx, sy);
          ctx.stroke();

          ctx.save();
          ctx.translate(lx, sy);
          ctx.rotate(side * (0.48 + (rng() - 0.5) * 0.36));
          ctx.shadowColor = "rgba(28, 36, 30, 0.16)";
          ctx.shadowBlur = 7;
          ctx.shadowOffsetY = 3;
          ctx.beginPath();
          ctx.moveTo(-rad * 0.25, rad * 0.92);
          ctx.bezierCurveTo(-rad * 1.08, rad * 0.42, -rad * 0.98, -rad * 0.78, 0, -rad * 0.98);
          ctx.bezierCurveTo(rad * 0.98, -rad * 0.78, rad * 1.08, rad * 0.42, rad * 0.25, rad * 0.92);
          ctx.quadraticCurveTo(0, rad * 1.05, -rad * 0.25, rad * 0.92);
          ctx.closePath();
          const g = ctx.createRadialGradient(-rad * 0.24, -rad * 0.22, 4, 0, 0, rad * 1.15);
          g.addColorStop(0, "#D9E4DA");
          g.addColorStop(0.55, "#9CB2A4");
          g.addColorStop(1, "#677F72");
          ctx.fillStyle = g;
          ctx.fill();
          ctx.shadowColor = "transparent";
          ctx.clip();
          ctx.globalAlpha = 0.28;
          ctx.drawImage(leafTex, -rad, -rad, rad * 2, rad * 2);
          ctx.restore();
        }
        applyMaterialGrain(ctx, W, H, spec.skuId, { intensity: 7, weave: "paper" });
        break;
      }
      case "eucalyptus-seeded": {
        drawNaturalStem(ctx, cx, 195, cx - 8, 1388, 7, 11, "woody", rng);
        for (let i = 0; i < 12; i += 1) {
          const t = i / 11;
          const sy = 215 + t * 560;
          const side = i % 2 === 0 ? -1 : 1;
          drawTexturedLeaf(ctx, leafTex, cx + side * 8, sy, side * (0.72 + rng() * 0.28), 88 - t * 20, 22, pal);
          if (i % 2 === 1) {
            // Arching panicle of sculptural seeded berries
            ctx.save();
            ctx.translate(cx + side * 24, sy - 10);
            ctx.rotate(side * (0.65 + t * 0.3));
            ctx.strokeStyle = "#6F7865";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(side * 42, 18, side * 78, 56);
            ctx.stroke();
            for (let b = 0; b < 7; b += 1) {
              const bx = side * (16 + b * 10 + (rng() - 0.5) * 14);
              const by = b * 7 + (rng() - 0.5) * 14;
              const bg = ctx.createRadialGradient(bx - 2, by - 2, 1, bx, by, 9);
              bg.addColorStop(0, "#D4DDD0");
              bg.addColorStop(0.65, "#879B86");
              bg.addColorStop(1, "#536655");
              ctx.fillStyle = bg;
              ctx.beginPath();
              ctx.ellipse(bx, by, 7.5, 9, b * 0.4, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }
        }
        applyMaterialGrain(ctx, W, H, spec.skuId, { intensity: 6, weave: "paper" });
        break;
      }
      case "ruscus-italian": {
        drawNaturalStem(ctx, cx, 130, cx + 6, 1388, 6, 10, "herbaceous", rng);
        for (let i = 0; i < 15; i += 1) {
          const t = i / 14;
          const sy = 148 + t * 620;
          const side = i % 2 === 0 ? -1 : 1;
          drawTexturedLeaf(ctx, leafTex, cx, sy, side * (0.58 + rng() * 0.22), 82 - t * 18, 22, pal, {
            curved: 0.16,
          });
        }
        break;
      }
      case "olive-branch": {
        drawNaturalStem(ctx, cx + 10, 175, cx - 4, 1388, 6, 11, "woody", rng);
        for (let i = 0; i < 16; i += 1) {
          const t = i / 15;
          const sy = 190 + t * 570;
          const side = i % 2 === 0 ? -1 : 1;
          drawTexturedLeaf(ctx, leafTex, cx + side * 4, sy, side * (0.64 + rng() * 0.26), 94, 14, pal, {
            frosted: rng() > 0.55,
          });
          if (i === 5 || i === 9 || i === 12) {
            ctx.save();
            ctx.translate(cx + side * 24, sy + 12);
            const og = ctx.createRadialGradient(-3, -4, 2, 0, 0, 15);
            og.addColorStop(0, "#C7D89E");
            og.addColorStop(0.65, "#7F995B");
            og.addColorStop(1, "#4B6133");
            ctx.fillStyle = og;
            ctx.beginPath();
            ctx.ellipse(0, 0, 11, 15, side * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
        break;
      }
      case "fern-boston": {
        drawNaturalStem(ctx, cx - 22, 130, cx + 6, 1388, 5, 11, "herbaceous", rng);
        for (let i = 0; i < 24; i += 1) {
          const t = i / 23;
          const sy = 145 + t * 645;
          const taper = Math.sin(t * Math.PI * 0.92 + 0.15);
          for (const side of [-1, 1]) {
            drawTexturedLeaf(
              ctx,
              leafTex,
              cx - 10 + t * 14,
              sy,
              side * (1.12 - t * 0.18),
              38 + taper * 78,
              11 + taper * 7,
              pal,
              { serrated: true },
            );
          }
        }
        break;
      }
      case "willow-sprig": {
        drawNaturalStem(ctx, cx - 25, 180, cx + 8, 1388, 6, 11, "woody", rng);
        // Arching weeping secondary canes
        for (const arc of [-1, 0, 1]) {
          ctx.save();
          ctx.strokeStyle = "#6C7D46";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(cx, 380);
          ctx.quadraticCurveTo(cx + arc * 95, 220, cx + arc * 155, 580 + Math.abs(arc) * 70);
          ctx.stroke();
          for (let k = 0; k < 11; k += 1) {
            const p = k / 10;
            const lx = cx + arc * (25 + p * 125);
            const ly = 260 + p * 310;
            drawTexturedLeaf(ctx, leafTex, lx, ly, arc * 0.35 + (k % 2 === 0 ? -0.4 : 0.4), 78, 10, pal);
          }
          ctx.restore();
        }
        break;
      }
      case "dusty-miller": {
        drawNaturalStem(ctx, cx, 320, cx, 1388, 9, 13, "herbaceous", rng);
        for (let i = 0; i < 9; i += 1) {
          const a = -1.2 + (i / 8) * 2.4;
          const sx = cx + Math.sin(a) * 44;
          const sy = cy + 60 + Math.abs(a) * 55;
          drawTexturedLeaf(ctx, leafTex, sx, sy, a * 0.85, 135 + (rng() - 0.5) * 30, 42, pal, {
            frosted: true,
            serrated: true,
          });
        }
        applyMaterialGrain(ctx, W, H, spec.skuId, { intensity: 14, weave: "linen" });
        break;
      }
      case "monstera-deliciosa": {
        drawNaturalStem(ctx, cx, cy + 75, cx - 10, 1388, 14, 18, "herbaceous", rng);
        ctx.save();
        ctx.translate(cx, cy + 12);
        // Sculptural glossy Monstera split blade filled with real leaf veining + fenestration ribs
        const lobes = [
          { ang: -1.15, len: 175, wid: 34 },
          { ang: -0.78, len: 210, wid: 38 },
          { ang: -0.42, len: 230, wid: 40 },
          { ang: 0, len: 245, wid: 46 },
          { ang: 0.42, len: 230, wid: 40 },
          { ang: 0.78, len: 210, wid: 38 },
          { ang: 1.15, len: 175, wid: 34 },
        ];
        // Center palm cordate plate
        drawTexturedLeaf(ctx, leafTex, 0, 50, 0, 210, 88, pal);
        for (const l of lobes) {
          drawTexturedLeaf(ctx, leafTex, Math.sin(l.ang) * 24, 10, l.ang, l.len, l.wid, pal, {
            curved: 0.1,
          });
        }
        ctx.restore();
        break;
      }
      case "autumn-oak-foliage": {
        drawNaturalStem(ctx, cx, 240, cx - 6, 1388, 8, 13, "woody", rng);
        for (let i = 0; i < 8; i += 1) {
          const t = i / 7;
          const sy = 250 + t * 440;
          const side = i % 2 === 0 ? -1 : 1;
          drawTexturedLeaf(ctx, leafTex, cx + side * 6, sy, side * (0.68 + rng() * 0.35), 118, 44, pal, {
            serrated: true,
          });
        }
        break;
      }
      case "lily-oriental-up":
      case "lily-oriental-angled": {
        const angled = spec.skuId === "lily-oriental-angled";
        drawNaturalStem(ctx, cx, cy + 40, cx, 1388, 12, 16, "herbaceous", rng);
        drawTexturedLeaf(ctx, leafTex, cx, cy + 160, -0.75, 145, 22, {
          deep: "#1E3F24",
          mid: "#36653A",
          petal: "#4E834E",
          rim: "#7EAE78",
        });
        drawTexturedLeaf(ctx, leafTex, cx, cy + 230, 0.78, 135, 20, {
          deep: "#1E3F24",
          mid: "#36653A",
          petal: "#4E834E",
          rim: "#7EAE78",
        });
        ctx.save();
        ctx.translate(cx, cy - 8);
        if (angled) ctx.transform(0.82, 0.14, -0.1, 1, 18, 0);
        for (let p = 0; p < 6; p += 1) {
          const a = (p / 6) * Math.PI * 2 + 0.18;
          ctx.save();
          ctx.rotate(a);
          drawTexturedPetal(ctx, petalTex, 48, 178, pal, rng, (p % 2 === 0 ? 1 : -1) * 0.08);
          ctx.restore();
        }
        // Copper pollen anthers
        for (let f = 0; f < 6; f += 1) {
          const fa = (f / 6) * Math.PI * 2;
          ctx.strokeStyle = "#8AA65E";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(Math.cos(fa) * 30, Math.sin(fa) * 26 - 10, Math.cos(fa) * 58, Math.sin(fa) * 50);
          ctx.stroke();
          ctx.fillStyle = "#B8531E";
          ctx.beginPath();
          ctx.ellipse(Math.cos(fa) * 60, Math.sin(fa) * 52, 8, 4.2, fa + 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;
      }
      case "orchid-white": {
        drawNaturalStem(ctx, cx + 18, 220, cx - 10, 1388, 8, 13, "herbaceous", rng);
        const florets = [
          { x: cx - 44, y: cy - 85, s: 0.92, r: -0.22 },
          { x: cx + 38, y: cy - 35, s: 1.0, r: 0.18 },
          { x: cx - 32, y: cy + 52, s: 0.96, r: -0.12 },
          { x: cx + 28, y: cy + 135, s: 0.88, r: 0.24 },
        ];
        for (const fl of florets) {
          ctx.save();
          ctx.translate(fl.x, fl.y);
          ctx.rotate(fl.r);
          ctx.scale(fl.s, fl.s);
          for (const a of [0, -1.15, 1.15, -2.5, 2.5]) {
            ctx.save();
            ctx.rotate(a);
            drawTexturedPetal(ctx, petalTex, a === 0 ? 34 : 52, a === 0 ? 64 : 68, pal, rng);
            ctx.restore();
          }
          // Orchid column lip with coral-amber nectar flecks
          ctx.fillStyle = pal.center;
          ctx.beginPath();
          ctx.ellipse(0, 8, 16, 18, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        break;
      }
      case "dahlia-burgundy": {
        drawNaturalStem(ctx, cx, cy + 40, cx, 1388, 11, 15, "herbaceous", rng);
        drawTexturedLeaf(ctx, leafTex, cx - 8, cy + 180, -0.78, 130, 38, {
          deep: "#1E3B25",
          mid: "#315838",
          petal: "#47754D",
          rim: "#74A278",
        }, { serrated: true });
        ctx.save();
        ctx.translate(cx, cy - 6);
        const rings = [
          { n: 18, dist: 54, rx: 32, ry: 88 },
          { n: 16, dist: 38, rx: 28, ry: 72 },
          { n: 14, dist: 24, rx: 24, ry: 56 },
          { n: 11, dist: 12, rx: 19, ry: 40 },
          { n: 7, dist: 4, rx: 14, ry: 26 },
        ];
        rings.forEach((ring, ri) => {
          for (let i = 0; i < ring.n; i += 1) {
            const a = (i / ring.n) * Math.PI * 2 + ri * 0.25 + (rng() - 0.5) * 0.1;
            ctx.save();
            ctx.translate(Math.cos(a) * ring.dist, Math.sin(a) * ring.dist * 0.92);
            ctx.rotate(a + Math.PI / 2);
            drawTexturedPetal(ctx, petalTex, ring.rx, ring.ry, pal, rng);
            ctx.restore();
          }
        });
        ctx.restore();
        break;
      }
      case "anemone-blush": {
        drawNaturalStem(ctx, cx, cy + 35, cx, 1388, 10, 14, "herbaceous", rng);
        drawTexturedLeaf(ctx, leafTex, cx, cy + 135, -0.9, 95, 24, {
          deep: "#284B2A",
          mid: "#3D6C3E",
          petal: "#598E57",
          rim: "#86B582",
        }, { serrated: true });
        drawTexturedLeaf(ctx, leafTex, cx, cy + 140, 0.9, 95, 24, {
          deep: "#284B2A",
          mid: "#3D6C3E",
          petal: "#598E57",
          rim: "#86B582",
        }, { serrated: true });
        ctx.save();
        ctx.translate(cx, cy - 6);
        for (let i = 0; i < 9; i += 1) {
          const a = (i / 9) * Math.PI * 2 + (rng() - 0.5) * 0.18;
          ctx.save();
          ctx.rotate(a);
          drawTexturedPetal(ctx, petalTex, 68, 138, pal, rng);
          ctx.restore();
        }
        // Rich velvety blue-black stamen eye
        ctx.fillStyle = "#191C2B";
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();
        for (let s = 0; s < 28; s += 1) {
          const sa = (s / 28) * Math.PI * 2;
          ctx.fillStyle = "#2E344D";
          ctx.beginPath();
          ctx.arc(Math.cos(sa) * 34, Math.sin(sa) * 34, 4.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;
      }
      case "lotus": {
        drawNaturalStem(ctx, cx, cy + 45, cx, 1388, 13, 17, "herbaceous", rng);
        ctx.save();
        ctx.translate(cx, cy + 8);
        for (const angle of [-0.52, 0.52, -0.26, 0.26, 0]) {
          ctx.save();
          ctx.rotate(angle);
          drawTexturedPetal(ctx, petalTex, 58, 154, pal, rng);
          ctx.restore();
        }
        ctx.restore();
        break;
      }
      case "lavender": {
        for (const offset of [-28, 0, 28]) {
          drawNaturalStem(ctx, cx + offset, 195 + Math.abs(offset), cx + offset * 0.2, 1388, 5, 7, "herbaceous", rng);
          for (let k = 0; k < 14; k += 1) {
            const ky = 185 + k * 24 + Math.abs(offset);
            for (const side of [-1, 1]) {
              ctx.save();
              ctx.translate(cx + offset + side * 8, ky);
              ctx.rotate(side * 0.45);
              drawTexturedPetal(ctx, petalTex, 10, 20, pal, rng);
              ctx.restore();
            }
          }
        }
        break;
      }
      default:
        break;
    }

    fs.writeFileSync(path.join(outDir, `${spec.skuId}.png`), canvas.toBuffer("image/png"));
  }
}

/**
 * Generates lush, crinkled, pleated 3D florist paper cones, crystal glass refraction vases,
 * and stoneware ceramic vessels (NEVER flat triangles or solid gradients).
 */
function generateRealisticVessels() {
  const outDir = path.join(MASTER_ROOT, "vessels");
  fs.mkdirSync(outDir, { recursive: true });
  const W = WORLD_MASTER_ASPECT.vesselWidthPx;
  const H = WORLD_MASTER_ASPECT.vesselHeightPx;
  const S = 1.4;

  for (const vessel of VESSEL_VISUAL_SPECS) {
    const backCanvas = createCanvas(W, H);
    const bCtx = backCanvas.getContext("2d");
    const frontCanvas = createCanvas(W, H);
    const fCtx = frontCanvas.getContext("2d");

    if (vessel.category === "wrap") {
      const isCellophane = vessel.texture === "cellophane";

      // 1. BACK WRAP: Asymmetric dual-sheet florist backing (solid depth behind stems — never hollow cut-outs!)
      bCtx.save();
      if (isCellophane) bCtx.globalAlpha = 0.45;
      // Left tall outer sheet
      const lBack = bCtx.createLinearGradient(270 * S, 490 * S, 620 * S, 1085 * S);
      lBack.addColorStop(0, vessel.foldLight);
      lBack.addColorStop(0.32, vessel.base);
      lBack.addColorStop(1, vessel.foldDark);
      bCtx.fillStyle = lBack;
      bCtx.beginPath();
      bCtx.moveTo(274 * S, 636 * S);
      bCtx.bezierCurveTo(286 * S, 540 * S, 326 * S, 496 * S, 386 * S, 512 * S);
      bCtx.bezierCurveTo(448 * S, 528 * S, 512 * S, 568 * S, 590 * S, 620 * S);
      bCtx.lineTo(588 * S, 1086 * S);
      bCtx.quadraticCurveTo(500 * S, 1098 * S, 412 * S, 1086 * S);
      bCtx.quadraticCurveTo(334 * S, 868 * S, 274 * S, 636 * S);
      bCtx.closePath();
      bCtx.fill();

      // Right staggered overlapping sheet with soft cast seam shadow onto left sheet
      if (!isCellophane) {
        bCtx.shadowColor = "rgba(26, 20, 16, 0.20)";
        bCtx.shadowBlur = 16;
        bCtx.shadowOffsetX = -5;
        bCtx.shadowOffsetY = 4;
      }
      const rBack = bCtx.createLinearGradient(390 * S, 495 * S, 724 * S, 1085 * S);
      rBack.addColorStop(0, vessel.foldLight);
      rBack.addColorStop(0.35, vessel.base);
      rBack.addColorStop(1, vessel.foldDark);
      bCtx.fillStyle = rBack;
      bCtx.beginPath();
      bCtx.moveTo(724 * S, 638 * S);
      bCtx.bezierCurveTo(712 * S, 544 * S, 668 * S, 492 * S, 608 * S, 506 * S);
      bCtx.bezierCurveTo(542 * S, 522 * S, 470 * S, 570 * S, 396 * S, 626 * S);
      bCtx.lineTo(412 * S, 1086 * S);
      bCtx.quadraticCurveTo(500 * S, 1098 * S, 588 * S, 1086 * S);
      bCtx.quadraticCurveTo(664 * S, 868 * S, 724 * S, 638 * S);
      bCtx.closePath();
      bCtx.fill();
      bCtx.shadowColor = "transparent";

      // Deep shadowed recessed pocket throat behind the stem cluster (creates true 3D depth)
      if (!isCellophane) {
        bCtx.save();
        bCtx.globalCompositeOperation = "source-atop";
        const cavGrad = bCtx.createRadialGradient(500 * S, 705 * S, 25 * S, 500 * S, 675 * S, 195 * S);
        cavGrad.addColorStop(0, "rgba(18, 14, 11, 0.56)");
        cavGrad.addColorStop(0.55, hexToRgba(vessel.foldDark, 0.48));
        cavGrad.addColorStop(1, "rgba(18, 14, 11, 0)");
        bCtx.fillStyle = cavGrad;
        bCtx.beginPath();
        bCtx.ellipse(500 * S, 680 * S, 195 * S, 155 * S, 0, 0, Math.PI * 2);
        bCtx.fill();
        bCtx.restore();
      }
      bCtx.restore();

      // 2. FRONT WRAP: Crisp diagonally crossed sheets meeting flush with back edges
      fCtx.save();
      if (isCellophane) {
        fCtx.fillStyle = "rgba(242, 250, 250, 0.28)";
      } else {
        const lGrad = fCtx.createLinearGradient(274 * S, 636 * S, 610 * S, 1085 * S);
        lGrad.addColorStop(0, vessel.foldLight);
        lGrad.addColorStop(0.55, vessel.base);
        lGrad.addColorStop(1, vessel.foldDark);
        fCtx.fillStyle = lGrad;
      }
      // Left-to-right under-fold sheet (flush edge at 274, 636)
      fCtx.beginPath();
      fCtx.moveTo(274 * S, 636 * S);
      fCtx.bezierCurveTo(374 * S, 676 * S, 468 * S, 728 * S, 546 * S, 756 * S);
      fCtx.quadraticCurveTo(568 * S, 922 * S, 588 * S, 1086 * S);
      fCtx.quadraticCurveTo(500 * S, 1098 * S, 412 * S, 1086 * S);
      fCtx.bezierCurveTo(362 * S, 908 * S, 310 * S, 758 * S, 274 * S, 636 * S);
      fCtx.closePath();
      fCtx.fill();

      // Right-to-left overlapping top lapel sheet (flush edge at 724, 638)
      if (!isCellophane) {
        fCtx.shadowColor = "rgba(28, 22, 16, 0.26)";
        fCtx.shadowBlur = 18;
        fCtx.shadowOffsetX = -6;
        fCtx.shadowOffsetY = 5;
        const rGrad = fCtx.createLinearGradient(465 * S, 638 * S, 724 * S, 1085 * S);
        rGrad.addColorStop(0, vessel.foldLight);
        rGrad.addColorStop(0.62, vessel.base);
        rGrad.addColorStop(1, vessel.foldDark);
        fCtx.fillStyle = rGrad;
      } else {
        fCtx.fillStyle = "rgba(255, 255, 255, 0.34)";
      }
      fCtx.beginPath();
      fCtx.moveTo(724 * S, 638 * S);
      fCtx.bezierCurveTo(620 * S, 672 * S, 526 * S, 714 * S, 470 * S, 748 * S);
      fCtx.quadraticCurveTo(446 * S, 916 * S, 428 * S, 1086 * S);
      fCtx.quadraticCurveTo(508 * S, 1098 * S, 588 * S, 1086 * S);
      fCtx.bezierCurveTo(640 * S, 912 * S, 690 * S, 762 * S, 724 * S, 638 * S);
      fCtx.closePath();
      fCtx.fill();
      fCtx.shadowColor = "transparent";

      // Radiating natural paper crinkle pleats clipped strictly INSIDE front paper sheets (never poking out above!)
      fCtx.save();
      fCtx.globalCompositeOperation = "source-atop";
      const creaseAngles = [-0.46, -0.28, -0.14, 0.12, 0.28, 0.44];
      creaseAngles.forEach((ang, idx) => {
        const startX = 500 * S + ang * 75 * S;
        const startY = 742 * S;
        const endX = 500 * S + Math.sin(ang) * 145 * S;
        const endY = 980 * S + (idx % 2) * 85;
        fCtx.strokeStyle = isCellophane
          ? "rgba(255, 255, 255, 0.68)"
          : idx % 2 === 0
            ? hexToRgba(vessel.foldDark, 0.24)
            : hexToRgba(vessel.foldLight, 0.32);
        fCtx.lineWidth = isCellophane ? 4 : 3.2;
        fCtx.beginPath();
        fCtx.moveTo(startX, startY);
        fCtx.quadraticCurveTo(
          (startX + endX) * 0.5 + (idx % 2 === 0 ? -10 : 10),
          (startY + endY) * 0.5,
          endX,
          endY,
        );
        fCtx.stroke();
      });
      fCtx.restore();

      // Soft paper edge highlight along upper cuff rims
      fCtx.strokeStyle = isCellophane ? "rgba(255,255,255,0.75)" : hexToRgba(vessel.foldLight, 0.52);
      fCtx.lineWidth = 2.4;
      fCtx.beginPath();
      fCtx.moveTo(286 * S, 636 * S);
      fCtx.bezierCurveTo(378 * S, 678 * S, 468 * S, 728 * S, 546 * S, 756 * S);
      fCtx.moveTo(714 * S, 642 * S);
      fCtx.bezierCurveTo(618 * S, 674 * S, 526 * S, 714 * S, 470 * S, 748 * S);
      fCtx.stroke();

      // Floral toile pattern on printed wrap
      if (vessel.texture === "floral") {
        fCtx.save();
        fCtx.globalCompositeOperation = "source-atop";
        const rngF = seededRng("paris-toile");
        for (let m = 0; m < 46; m += 1) {
          const mx = (310 + rngF() * 380) * S;
          const my = (670 + rngF() * 390) * S;
          const mr = 8 + rngF() * 8;
          fCtx.fillStyle = "rgba(96, 122, 99, 0.32)";
          fCtx.beginPath();
          fCtx.ellipse(mx - mr, my + 2, mr * 0.7, mr * 0.25, -0.4, 0, Math.PI * 2);
          fCtx.ellipse(mx + mr, my + 2, mr * 0.7, mr * 0.25, 0.4, 0, Math.PI * 2);
          fCtx.fill();
          fCtx.fillStyle = "rgba(176, 98, 108, 0.34)";
          fCtx.beginPath();
          fCtx.arc(mx, my, mr * 0.6, 0, Math.PI * 2);
          ctxFillDot(fCtx, mx, my, mr * 0.22, "rgba(218, 182, 102, 0.48)");
        }
        fCtx.restore();
      }
      fCtx.restore();

      if (!isCellophane) {
        applyMaterialGrain(bCtx, W, H, `${vessel.id}-b`, {
          intensity: vessel.texture === "kraft" ? 13 : 9,
          weave: vessel.texture,
          warmSpeckle: true,
        });
        applyMaterialGrain(fCtx, W, H, `${vessel.id}-f`, {
          intensity: vessel.texture === "kraft" ? 13 : 9,
          weave: vessel.texture,
          warmSpeckle: true,
        });
      }
    } else if (vessel.texture === "glass") {
      // Crystal clear cylinder vase with optical Fresnel rim & water meniscus
      bCtx.save();
      bCtx.strokeStyle = "rgba(116, 152, 148, 0.58)";
      bCtx.lineWidth = 4;
      bCtx.beginPath();
      bCtx.ellipse(500 * S, 700 * S, 105 * S, 18 * S, 0, Math.PI, Math.PI * 2);
      bCtx.stroke();
      bCtx.restore();

      fCtx.save();
      const gBody = fCtx.createLinearGradient(375 * S, 700 * S, 625 * S, 700 * S);
      gBody.addColorStop(0, "rgba(120, 158, 154, 0.42)");
      gBody.addColorStop(0.14, "rgba(255, 255, 255, 0.34)");
      gBody.addColorStop(0.32, "rgba(232, 245, 244, 0.08)");
      gBody.addColorStop(0.75, "rgba(232, 245, 244, 0.10)");
      gBody.addColorStop(0.90, "rgba(255, 255, 255, 0.38)");
      gBody.addColorStop(1, "rgba(115, 152, 148, 0.45)");
      fCtx.fillStyle = gBody;
      fCtx.beginPath();
      fCtx.moveTo(395 * S, 700 * S);
      fCtx.quadraticCurveTo(366 * S, 905 * S, 396 * S, 1080 * S);
      fCtx.quadraticCurveTo(500 * S, 1106 * S, 604 * S, 1080 * S);
      fCtx.quadraticCurveTo(634 * S, 905 * S, 605 * S, 700 * S);
      fCtx.quadraticCurveTo(500 * S, 722 * S, 395 * S, 700 * S);
      fCtx.closePath();
      fCtx.fill();

      // Crisp optical rim ellipse & meniscus highlight on crystal vase
      fCtx.strokeStyle = "rgba(88, 124, 120, 0.48)";
      fCtx.lineWidth = 3.6;
      fCtx.beginPath();
      fCtx.moveTo(395 * S, 700 * S);
      fCtx.quadraticCurveTo(500 * S, 722 * S, 605 * S, 700 * S);
      fCtx.stroke();

      // Solid glass bottom refraction block & water meniscus ellipse
      fCtx.fillStyle = "rgba(162, 196, 192, 0.52)";
      fCtx.beginPath();
      fCtx.ellipse(500 * S, 1072 * S, 102 * S, 18 * S, 0, 0, Math.PI * 2);
      fCtx.fill();
      fCtx.strokeStyle = "rgba(255, 255, 255, 0.84)";
      fCtx.lineWidth = 3.5;
      fCtx.beginPath();
      fCtx.ellipse(500 * S, 770 * S, 112 * S, 14 * S, 0, 0, Math.PI);
      fCtx.stroke();

      // Vertical studio softbox glass reflections
      fCtx.fillStyle = "rgba(255, 255, 255, 0.48)";
      fCtx.beginPath();
      fCtx.ellipse(422 * S, 885 * S, 10 * S, 155 * S, 0.03, 0, Math.PI * 2);
      fCtx.fill();
      fCtx.restore();
    } else {
      // Wheel-thrown Stoneware Ceramic / Terracotta Pottery Vase
      bCtx.save();
      bCtx.fillStyle = vessel.lining;
      bCtx.beginPath();
      bCtx.ellipse(500 * S, 702 * S, 108 * S, 22 * S, 0, 0, Math.PI * 2);
      bCtx.fill();
      bCtx.restore();

      fCtx.save();
      const sGrad = fCtx.createLinearGradient(366 * S, 700 * S, 636 * S, 1085 * S);
      sGrad.addColorStop(0, vessel.foldLight);
      sGrad.addColorStop(0.32, vessel.base);
      sGrad.addColorStop(0.84, vessel.foldDark);
      sGrad.addColorStop(1, vessel.base);
      fCtx.fillStyle = sGrad;
      fCtx.beginPath();
      fCtx.moveTo(392 * S, 700 * S);
      fCtx.bezierCurveTo(358 * S, 855 * S, 368 * S, 995 * S, 404 * S, 1082 * S);
      fCtx.quadraticCurveTo(500 * S, 1106 * S, 596 * S, 1082 * S);
      fCtx.bezierCurveTo(632 * S, 995 * S, 642 * S, 855 * S, 608 * S, 700 * S);
      fCtx.quadraticCurveTo(500 * S, 728 * S, 392 * S, 700 * S);
      fCtx.closePath();
      fCtx.fill();
      fCtx.strokeStyle = hexToRgba(vessel.foldLight, 0.72);
      fCtx.lineWidth = 5;
      fCtx.beginPath();
      fCtx.moveTo(394 * S, 702 * S);
      fCtx.quadraticCurveTo(500 * S, 728 * S, 606 * S, 702 * S);
      fCtx.stroke();
      fCtx.restore();

      applyMaterialGrain(fCtx, W, H, `${vessel.id}-pottery`, {
        intensity: 9,
        weave: vessel.texture,
      });
    }

    fs.writeFileSync(path.join(outDir, `${vessel.id}-back.png`), backCanvas.toBuffer("image/png"));
    fs.writeFileSync(path.join(outDir, `${vessel.id}-front.png`), frontCanvas.toBuffer("image/png"));
  }
}

function ctxFillDot(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Generates voluptuous shaded fabric & twine ribbons (double-bow, silk-tails, minimal-knot, wax-band).
 */
function generateRealisticRibbons() {
  const outDir = path.join(MASTER_ROOT, "ribbons");
  fs.mkdirSync(outDir, { recursive: true });
  const S = WORLD_MASTER_ASPECT.bowSizePx;

  const drawFabricBow = (pal, style, finish) => {
    const canvas = createCanvas(S, S);
    const ctx = canvas.getContext("2d");
    const rng = seededRng(`${finish}-${style}-${pal.main}`);

    ctx.save();
    ctx.translate(S / 2, S / 2);

    const isVelvet = finish === "velvet";
    const isSatin = finish === "satin";
    const isTwine = finish === "twine" || pal.weave;

    // 1. Curved hug collar wrap band with tapered edge shadow around bouquet neck
    const bandGrad = ctx.createLinearGradient(-152, 0, 152, 0);
    bandGrad.addColorStop(0, pal.dark);
    bandGrad.addColorStop(0.28, pal.main);
    bandGrad.addColorStop(0.5, isVelvet ? pal.main : pal.light);
    bandGrad.addColorStop(0.72, pal.main);
    bandGrad.addColorStop(1, pal.dark);

    ctx.save();
    ctx.shadowColor = "rgba(22, 18, 15, 0.25)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    if (isTwine) {
      // Multi-ply braided hemp cord wrapped 3 natural turns
      for (const dy of [-9, -1, 7]) {
        ctx.strokeStyle = bandGrad;
        ctx.lineWidth = 8.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-142, dy - 4);
        ctx.quadraticCurveTo(0, dy + 14, 142, dy - 4);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = bandGrad;
      ctx.beginPath();
      ctx.moveTo(-148, -17);
      ctx.quadraticCurveTo(0, -4, 148, -17);
      ctx.lineTo(142, 18);
      ctx.quadraticCurveTo(0, 29, -142, 18);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 2. Draped undulating silk/satin tails
    if (style === "double-bow" || style === "silk-tails") {
      const tailLen = style === "silk-tails" || finish === "silk" ? 255 : 175;
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.rotate(side * 0.14);
        const w = isTwine ? 8 : style === "silk-tails" ? 30 : 24;
        const tGrad = ctx.createLinearGradient(0, 0, side * 42, tailLen);
        tGrad.addColorStop(0, pal.dark);
        tGrad.addColorStop(0.35, pal.main);
        tGrad.addColorStop(0.68, isVelvet ? pal.main : pal.light);
        tGrad.addColorStop(1, pal.dark);
        ctx.fillStyle = tGrad;
        ctx.beginPath();
        ctx.moveTo(side * -4, 6);
        ctx.bezierCurveTo(side * 22, tailLen * 0.34, side * 4, tailLen * 0.68, side * (w + 18), tailLen);
        ctx.lineTo(side * (w + 4), tailLen - 14);
        ctx.lineTo(side * (w - 10), tailLen + 6);
        ctx.bezierCurveTo(side * -8, tailLen * 0.65, side * 10, tailLen * 0.32, side * -12, 8);
        ctx.closePath();
        ctx.fill();
        if (isSatin) {
          ctx.strokeStyle = hexToRgba(pal.edge, 0.55);
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(side * 2, 18);
          ctx.bezierCurveTo(side * 16, tailLen * 0.35, side * 4, tailLen * 0.66, side * (w + 8), tailLen - 22);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // 3. Sculpted pleated S-loops for Double Bow or Twine Bow
    if (style === "double-bow") {
      for (const scaleMult of [1, 0.72]) {
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.scale(scaleMult, scaleMult);
          ctx.shadowColor = "rgba(22, 18, 15, 0.22)";
          ctx.shadowBlur = 12;
          ctx.shadowOffsetY = 4;
          const loopGrad = ctx.createRadialGradient(side * 58, -10, 6, side * 72, 2, 95);
          loopGrad.addColorStop(0, isVelvet ? pal.main : pal.light);
          loopGrad.addColorStop(0.62, pal.main);
          loopGrad.addColorStop(1, pal.dark);
          ctx.fillStyle = loopGrad;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(side * 46, -64, side * 144, -52, side * 140, 2);
          ctx.bezierCurveTo(side * 136, 48, side * 48, 38, 0, 8);
          ctx.closePath();
          ctx.fill();

          // Dark interior loop fold shadow
          ctx.shadowColor = "transparent";
          ctx.fillStyle = hexToRgba(pal.dark, 0.55);
          ctx.beginPath();
          ctx.ellipse(side * 72, 2, 36, 12, side * -0.18, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    } else if (style === "silk-tails") {
      // Soft single florist tie-ear loops peeking behind the pinched center knot for plush silhouette
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.shadowColor = "rgba(22, 18, 15, 0.2)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 3;
        const earGrad = ctx.createRadialGradient(side * 46, -8, 4, side * 56, 0, 74);
        earGrad.addColorStop(0, isVelvet ? pal.main : pal.light);
        earGrad.addColorStop(0.65, pal.main);
        earGrad.addColorStop(1, pal.dark);
        ctx.fillStyle = earGrad;
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.bezierCurveTo(side * 34, -46, side * 102, -34, side * 96, 4);
        ctx.bezierCurveTo(side * 90, 34, side * 34, 28, 0, 6);
        ctx.closePath();
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.fillStyle = hexToRgba(pal.dark, 0.45);
        ctx.beginPath();
        ctx.ellipse(side * 50, 2, 22, 7.5, side * -0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 4. Center Pinched Knot OR Antique Botanical Wax Medallion
    if (style === "wax-band") {
      ctx.shadowColor = "rgba(24, 18, 15, 0.35)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
      const wg = ctx.createRadialGradient(-8, -8, 4, 0, 0, 34);
      wg.addColorStop(0, "#B85F59");
      wg.addColorStop(0.7, "#8A3C38");
      wg.addColorStop(1, "#5A211F");
      ctx.fillStyle = wg;
      ctx.beginPath();
      for (let k = 0; k < 18; k += 1) {
        const a = (k / 18) * Math.PI * 2;
        const rr = 30 + (rng() - 0.5) * 4;
        if (k === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = "rgba(246, 226, 210, 0.36)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 21, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const kGrad = ctx.createRadialGradient(-5, -5, 2, 0, 2, 24);
      kGrad.addColorStop(0, isVelvet ? pal.main : pal.light);
      kGrad.addColorStop(0.65, pal.main);
      kGrad.addColorStop(1, pal.dark);
      ctx.fillStyle = kGrad;
      ctx.beginPath();
      ctx.ellipse(0, 2, 20, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    if (isVelvet || isTwine) {
      applyMaterialGrain(ctx, S, S, `rib-${finish}-${style}-${pal.main}`, {
        intensity: isVelvet ? 14 : 11,
        weave: "linen",
      });
    }
    return canvas.toBuffer("image/png");
  };

  for (const [colorId, pal] of Object.entries(RIBBON_PALETTES)) {
    for (const bowStyle of BOW_STYLE_LIST) {
      // Base unprefixed Satin/Twine style + explicit finish prefix
      const defFinish = pal.weave ? "twine" : "satin";
      fs.writeFileSync(path.join(outDir, `${bowStyle}-${colorId}.png`), drawFabricBow(pal, bowStyle, defFinish));
      for (const finish of RIBBON_FINISH_LIST) {
        fs.writeFileSync(
          path.join(outDir, `finish-${finish}-${bowStyle}-${colorId}.png`),
          drawFabricBow(pal, bowStyle, finish),
        );
      }
    }
  }
}

function enrichOccasionTags(spec) {
  const tags = new Set(spec.occasionTags);
  if (spec.colorFamily === "crimson" || spec.colorFamily === "blush" || spec.skuId.includes("rose") || spec.skuId.includes("peony")) {
    tags.add("valentines-day");
  }
  if (spec.colorFamily === "ivory" || spec.skuId.includes("orchid") || spec.skuId.includes("white") || spec.skuId.includes("olive")) {
    tags.add("wedding");
  }
  if (spec.colorFamily === "amber" || spec.skuId.includes("sunflower") || spec.skuId.includes("lily") || spec.skuId.includes("ranunculus")) {
    tags.add("congratulations");
    tags.add("get-well");
  }
  if (spec.colorFamily === "amber" || spec.skuId.includes("daisy") || spec.skuId.includes("tulip")) {
    tags.add("friendship");
  }
  if (spec.colorFamily === "blush" || spec.colorFamily === "lavender" || spec.skuId.includes("peony") || spec.skuId.includes("ranunculus") || spec.skuId.includes("lily")) {
    tags.add("mothers-day");
  }
  if (spec.role === "foliage" || spec.role === "filler" || tags.has("thank-you") || tags.has("miss-you")) {
    tags.add("just-because");
  }
  return Array.from(tags);
}

function deriveBotanicalType(spec) {
  const map = {
    rose: "Angiosperm / Rosaceae / Rosa hybrida",
    peony: "Angiosperm / Paeoniaceae / Paeonia lactiflora",
    tulip: "Angiosperm / Liliaceae / Tulipa gesneriana",
    sunflower: "Angiosperm / Asteraceae / Helianthus annuus",
    lily: "Angiosperm / Liliaceae / Lilium orientalis",
    orchid: "Angiosperm / Orchidaceae / Phalaenopsis",
    dahlia: "Angiosperm / Asteraceae / Dahlia pinnata",
    hydrangea: "Angiosperm / Hydrangeaceae / Hydrangea macrophylla",
    ranunculus: "Angiosperm / Ranunculaceae / Ranunculus asiaticus",
    anemone: "Angiosperm / Ranunculaceae / Anemone coronaria",
    "babys-breath": "Angiosperm / Caryophyllaceae / Gypsophila paniculata",
    chamomile: "Angiosperm / Asteraceae / Matricaria chamomilla",
    lavender: "Angiosperm / Lamiaceae / Lavandula angustifolia",
    waxflower: "Angiosperm / Myrtaceae / Chamelaucium uncinatum",
    lotus: "Angiosperm / Nelumbonaceae / Nelumbo nucifera",
    aster: "Angiosperm / Asteraceae / Symphyotrichum",
    eucalyptus: "Angiosperm / Myrtaceae / Eucalyptus",
    fern: "Pteridophyta / Polypodiopsida",
    olive: "Angiosperm / Oleaceae / Olea europaea",
    ruscus: "Angiosperm / Asparagaceae / Ruscus hypoglossum",
    willow: "Angiosperm / Salicaceae / Salix babylonica",
    pine: "Gymnosperm / Pinaceae / Pinus sylvestris",
    "dusty-miller": "Angiosperm / Asteraceae / Jacobaea maritima",
    monstera: "Angiosperm / Araceae / Monstera deliciosa",
    oak: "Angiosperm / Fagaceae / Quercus rubra",
    carnation: "Angiosperm / Caryophyllaceae / Dianthus caryophyllus",
    camellia: "Angiosperm / Theaceae / Camellia japonica",
    zinnia: "Angiosperm / Asteraceae / Zinnia elegans",
    magnolia: "Angiosperm / Magnoliaceae / Magnolia grandiflora",
    salal: "Angiosperm / Ericaceae / Gaultheria shallon",
    pittosporum: "Angiosperm / Pittosporaceae / Pittosporum tobira",
  };
  return map[spec.familyId] || `Angiosperm / ${spec.familyId}`;
}

function deriveBloomStage(spec) {
  if (spec.role === "petal") return "Loose Petal";
  if (spec.role === "foliage") return "Mature Foliage";
  if (spec.variantLabel?.includes("Bud")) return "Closed Bud";
  if (spec.variantLabel?.includes("Half")) return "Half Open";
  if (spec.variantLabel?.includes("Cluster") || spec.variantLabel?.includes("Spray")) return "Lush Cluster";
  return "Full Bloom";
}

function deriveFacingAngle(spec) {
  if (spec.role === "petal") return "Flat Specimen";
  if (spec.skuId.includes("angled") || spec.variantLabel?.includes("Angled")) return "Three-Quarter Angled";
  if (spec.skuId.includes("tilted") || spec.variantLabel?.includes("Tilted")) return "Profile / Tilted";
  if (spec.variantLabel?.includes("Spray")) return "Arching Spray";
  return "Front-Facing";
}

function writeCatalogMetaJson() {
  const entries = BOTANICAL_SPECS.map((spec) => {
    const isPetal = spec.role === "petal";
    return {
      skuId: spec.skuId,
      familyId: spec.familyId,
      speciesSlug: spec.speciesSlug,
      hasSpeciesPage: spec.hasSpeciesPage,
      colorAnchor: spec.colorAnchor,
      name: spec.name,
      variantLabel: spec.variantLabel,
      role: spec.role,
      colorFamily: spec.colorFamily,
      colorHex: spec.colorHex,
      meaningShort: spec.meaningShort,
      meaningFull: spec.meaningFull,
      occasionTags: enrichOccasionTags(spec),
      anchorX: isPetal ? 0.5 : WORLD_MASTER_ASPECT.stemAnchorX,
      anchorY: isPetal ? 0.5 : WORLD_MASTER_ASPECT.stemAnchorY,
      naturalWidth: isPetal ? WORLD_MASTER_ASPECT.petalNaturalW : WORLD_MASTER_ASPECT.stemNaturalW,
      naturalHeight: isPetal ? WORLD_MASTER_ASPECT.petalNaturalH : WORLD_MASTER_ASPECT.stemNaturalH,
      headRadiusWorld: spec.headRadiusWorld,
      stemLengthWorld: spec.stemLengthWorld,
      isRadialSymmetric: spec.isRadialSymmetric,
      allowFrontDrape: spec.allowFrontDrape,
      defaultMinRotDeg: spec.defaultMinRotDeg,
      defaultMaxRotDeg: spec.defaultMaxRotDeg,
      aspectRatio: isPetal ? 1.0 : Number((WORLD_MASTER_ASPECT.stemWidthPx / WORLD_MASTER_ASPECT.stemHeightPx).toFixed(2)),
      preferredWidth: isPetal ? WORLD_MASTER_ASPECT.petalNaturalW : WORLD_MASTER_ASPECT.stemNaturalW,
      preferredHeight: isPetal ? WORLD_MASTER_ASPECT.petalNaturalH : WORLD_MASTER_ASPECT.stemNaturalH,
      botanicalType: deriveBotanicalType(spec),
      bloomStage: deriveBloomStage(spec),
      facingAngle: deriveFacingAngle(spec),
      license: "Petal & Prose Proprietary Photographic Studio License — 100% Bespoke Studio Asset",
    };
  });
  fs.mkdirSync(MASTER_ROOT, { recursive: true });
  fs.writeFileSync(path.join(MASTER_ROOT, "catalog-meta.json"), JSON.stringify(entries, null, 2));
}

async function main() {
  const texDir = path.join(MASTER_ROOT, "_textures");
  const leafTex = await loadImage(path.join(texDir, "real-leaf-veins.png"));
  const petalTex = await loadImage(path.join(texDir, "real-petal-grain.png"));

  console.log("Generating 16 texture-mapped botanical stems...");
  await generateRemainingBotanicals(leafTex, petalTex);
  console.log("Generating 11 pleated photorealistic wraps & vases...");
  generateRealisticVessels();
  console.log("Generating 120 textured fabric/twine ribbons...");
  generateRealisticRibbons();
  writeCatalogMetaJson();
  console.log("Milestone R1 master generation complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
