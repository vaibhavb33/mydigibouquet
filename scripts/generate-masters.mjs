import fs from "node:fs";
import path from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import {
  BOTANICAL_SPECS,
  BOW_STYLE_LIST,
  RIBBON_FINISH_LIST,
  RIBBON_PALETTES,
  VESSEL_VISUAL_SPECS,
  WORLD_MASTER_ASPECT,
} from "./catalog-data.mjs";

const MASTER_ROOT = path.resolve(process.cwd(), "assets-master");

function seededRng(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function next() {
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

function drawHerbaceousStem(ctx, startX, startY, endX, endY, widthPx, curveDx = 12, options = {}) {
  const {
    darkColor = "#3A5434",
    midColor = "#597A4E",
    lightColor = "#88A878",
    addThorns = false,
    addClaspingLeaf = false,
    omitLeaves = false,
    seed = 1,
  } = options;

  const ctrlX = (startX + endX) * 0.5 + curveDx;
  const ctrlY = (startY + endY) * 0.5;

  // Base shadow pass -> main cylinder -> sunlit ridge highlight
  ctx.save();
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
  ctx.lineWidth = widthPx;
  const grad = ctx.createLinearGradient(startX - widthPx, startY, startX + widthPx, endY);
  grad.addColorStop(0, darkColor);
  grad.addColorStop(0.45, midColor);
  grad.addColorStop(1, darkColor);
  ctx.strokeStyle = grad;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(startX - widthPx * 0.14, startY + 8);
  ctx.quadraticCurveTo(ctrlX - widthPx * 0.14, ctrlY, endX - widthPx * 0.12, endY - 12);
  ctx.lineWidth = Math.max(2, widthPx * 0.28);
  ctx.strokeStyle = hexToRgba(lightColor, 0.55);
  ctx.stroke();

  // Optional clean diagonal floristry cut tip
  ctx.fillStyle = "#C9D7B2";
  ctx.beginPath();
  ctx.ellipse(endX, endY, widthPx * 0.45, widthPx * 0.25, -0.35, 0, Math.PI * 2);
  ctx.fill();

  if (addThorns) {
    const thornT = [0.22, 0.41, 0.58, 0.74];
    thornT.forEach((t, idx) => {
      const omt = 1 - t;
      const px = omt * omt * startX + 2 * omt * t * ctrlX + t * t * endX;
      const py = omt * omt * startY + 2 * omt * t * ctrlY + t * t * endY;
      const side = (idx + seed) % 2 === 0 ? 1 : -1;
      ctx.fillStyle = darkColor;
      ctx.beginPath();
      ctx.moveTo(px + side * (widthPx * 0.42), py - 9);
      ctx.quadraticCurveTo(px + side * (widthPx * 1.45), py - 5, px + side * (widthPx * 1.65), py + 6);
      ctx.quadraticCurveTo(px + side * (widthPx * 0.8), py + 4, px + side * (widthPx * 0.42), py + 7);
      ctx.closePath();
      ctx.fill();
    });
  }

  // Stem leaves halfway down above collar
  const drawLeaf = (t, side, len, wid, tilt) => {
    const omt = 1 - t;
    const lx = omt * omt * startX + 2 * omt * t * ctrlX + t * t * endX;
    const ly = omt * omt * startY + 2 * omt * t * ctrlY + t * t * endY;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(side * tilt);
    const lgrad = ctx.createLinearGradient(0, 0, side * len, -len * 0.45);
    lgrad.addColorStop(0, darkColor);
    lgrad.addColorStop(0.5, midColor);
    lgrad.addColorStop(1, lightColor);
    ctx.fillStyle = lgrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(side * len * 0.3, -wid, side * len * 0.85, -wid * 0.75, side * len, -len * 0.35);
    ctx.bezierCurveTo(side * len * 0.8, wid * 0.45, side * len * 0.25, wid * 0.65, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hexToRgba(lightColor, 0.45);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(side * len * 0.55, -wid * 0.1, side * len * 0.92, -len * 0.32);
    ctx.stroke();
    ctx.restore();
  };

  if (!omitLeaves) {
    if (addClaspingLeaf) {
      drawLeaf(0.46, -1, 138, 42, 0.32);
      drawLeaf(0.52, 1, 125, 38, 0.28);
    } else {
      drawLeaf(0.18, -1, 86, 40, 0.25);
      drawLeaf(0.24, 1, 78, 36, 0.22);
      drawLeaf(0.38, -1, 74, 34, 0.3);
    }
  }

  ctx.restore();
}

function drawCalyxSepals(ctx, cx, cy, scale = 1, count = 5) {
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < count; i += 1) {
    const a = -0.75 + (i / Math.max(1, count - 1)) * 1.5;
    ctx.save();
    ctx.rotate(a);
    const grad = ctx.createLinearGradient(0, 0, 0, -68 * scale);
    grad.addColorStop(0, "#385232");
    grad.addColorStop(0.7, "#5B7D4E");
    grad.addColorStop(1, "#7EA26B");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 8 * scale);
    ctx.bezierCurveTo(-18 * scale, -18 * scale, -12 * scale, -52 * scale, 0, -74 * scale);
    ctx.bezierCurveTo(12 * scale, -52 * scale, 18 * scale, -18 * scale, 0, 8 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawScallopedPetal(ctx, radiusX, radiusY, palette, rng, opts = {}) {
  const { ruffle = 0.08, veinCount = 5, innerDarkness = 0.72, alpha = 0.97 } = opts;
  ctx.save();
  ctx.globalAlpha = alpha;

  const grad = ctx.createRadialGradient(0, -radiusY * 0.25, radiusY * 0.08, 0, -radiusY * 0.55, radiusY * 1.15);
  grad.addColorStop(0, palette.deep);
  grad.addColorStop(innerDarkness * 0.55, palette.mid);
  grad.addColorStop(0.86, palette.petal);
  grad.addColorStop(1, palette.rim);

  const wTop = radiusX * (0.95 + (rng() - 0.5) * 0.14);
  const wMid = radiusX * 0.85;
  const wave1 = (rng() - 0.5) * radiusY * ruffle;
  const wave2 = (rng() - 0.5) * radiusY * ruffle;

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-wMid, -radiusY * 0.22, -wTop * 1.1, -radiusY * 0.75, -wTop * 0.45, -radiusY * 0.98 + wave1);
  ctx.bezierCurveTo(-wTop * 0.15, -radiusY * 1.07, wTop * 0.15, -radiusY * 1.06 + wave2, wTop * 0.46, -radiusY * 0.97);
  ctx.bezierCurveTo(wTop * 1.1, -radiusY * 0.75, wMid, -radiusY * 0.22, 0, 0);
  ctx.closePath();
  ctx.fill();

  // Subtle rim edge sheen
  ctx.strokeStyle = hexToRgba(palette.rim, 0.24);
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Organic veins
  ctx.strokeStyle = hexToRgba(palette.deep, 0.13);
  ctx.lineWidth = 1.25;
  for (let v = 0; v < veinCount; v += 1) {
    const f = ((v + 0.5) / veinCount - 0.5) * 1.3;
    ctx.beginPath();
    ctx.moveTo(f * 6, -4);
    ctx.quadraticCurveTo(f * wMid * 0.55, -radiusY * 0.52, f * wTop * 0.7, -radiusY * 0.9);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRoseOpen(ctx, cx, cy, palette, rng, seedNum) {
  drawHerbaceousStem(ctx, cx, cy + 45, cx, 1300, 17, (rng() - 0.5) * 26, {
    addThorns: true,
    seed: seedNum,
  });
  drawCalyxSepals(ctx, cx, cy + 125, 1.35, 5);

  ctx.save();
  ctx.translate(cx, cy - 8);

  // Outer guard ring (8 petals), middle 2 rings (9 + 8), inner spiraled heart (10 petals)
  const rings = [
    { count: 8, dist: 58, rx: 86, ry: 120, rotBias: 0.1, offsetY: 16 },
    { count: 9, dist: 38, rx: 72, ry: 102, rotBias: 0.42, offsetY: 8 },
    { count: 8, dist: 24, rx: 56, ry: 82, rotBias: 0.85, offsetY: 2 },
    { count: 7, dist: 12, rx: 42, ry: 60, rotBias: 1.3, offsetY: -4 },
    { count: 5, dist: 4, rx: 28, ry: 40, rotBias: 1.9, offsetY: -6 },
  ];

  rings.forEach((ring, rIdx) => {
    for (let i = 0; i < ring.count; i += 1) {
      const theta = (i / ring.count) * Math.PI * 2 + ring.rotBias + (rng() - 0.5) * 0.18;
      ctx.save();
      ctx.translate(Math.cos(theta) * ring.dist, Math.sin(theta) * ring.dist * 0.85 + ring.offsetY);
      ctx.rotate(theta + Math.PI * 0.5);
      drawScallopedPetal(ctx, ring.rx, ring.ry, palette, rng, {
        ruffle: rIdx === 0 ? 0.1 : 0.06,
        alpha: 0.96,
      });
      ctx.restore();
    }
  });

  // Inner rosette shadow spiral + subtle nectar highlight
  const centerGlow = ctx.createRadialGradient(0, -6, 2, 0, -6, 36);
  centerGlow.addColorStop(0, palette.center);
  centerGlow.addColorStop(0.55, hexToRgba(palette.deep, 0.82));
  centerGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = centerGlow;
  ctx.beginPath();
  ctx.arc(0, -6, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawRoseHalf(ctx, cx, cy, palette, rng, seedNum) {
  drawHerbaceousStem(ctx, cx, cy + 50, cx, 1300, 16, 14, { addThorns: true, seed: seedNum });
  drawCalyxSepals(ctx, cx, cy + 88, 1.35, 5);

  ctx.save();
  ctx.translate(cx, cy + 12);

  // Reflexed outer guard petals leaning out
  for (let i = -2; i <= 2; i += 1) {
    ctx.save();
    ctx.translate(i * 22, 16);
    ctx.rotate(i * 0.34);
    drawScallopedPetal(ctx, 64, 128, palette, rng, { ruffle: 0.08 });
    ctx.restore();
  }
  // Tall inner scrolled goblet cone
  for (let i = -2; i <= 2; i += 1) {
    ctx.save();
    ctx.translate(i * 12, 8);
    ctx.rotate(i * 0.18);
    drawScallopedPetal(ctx, 50, 122, palette, rng, { ruffle: 0.04 });
    ctx.restore();
  }
  // Central overlapping furled tongue petals
  ctx.save();
  ctx.rotate(-0.14);
  drawScallopedPetal(ctx, 42, 108, palette, rng, { ruffle: 0.02 });
  ctx.restore();
  ctx.save();
  ctx.rotate(0.16);
  drawScallopedPetal(ctx, 36, 98, palette, rng, { ruffle: 0.02 });
  ctx.restore();

  ctx.restore();
}

function drawRoseBud(ctx, cx, cy, palette, rng, seedNum) {
  drawHerbaceousStem(ctx, cx, cy + 55, cx, 1300, 15, -10, { addThorns: true, seed: seedNum });

  ctx.save();
  ctx.translate(cx, cy + 20);
  // Plump emerald receptacle cup
  const recGrad = ctx.createLinearGradient(-32, 20, 32, 70);
  recGrad.addColorStop(0, "#4B6A42");
  recGrad.addColorStop(1, "#2F462A");
  ctx.fillStyle = recGrad;
  ctx.beginPath();
  ctx.moveTo(-26, 20);
  ctx.bezierCurveTo(-30, 56, -12, 84, 0, 88);
  ctx.bezierCurveTo(12, 84, 30, 56, 26, 20);
  ctx.closePath();
  ctx.fill();

  // Tightly furled pointed rosebud spiral
  ctx.save();
  ctx.translate(0, 22);
  ctx.rotate(-0.08);
  drawScallopedPetal(ctx, 38, 120, palette, rng, { ruffle: 0.01 });
  ctx.rotate(0.18);
  drawScallopedPetal(ctx, 32, 114, palette, rng, { ruffle: 0.01 });
  ctx.restore();

  // Clasping narrow emerald sepals curving upward around bud
  drawCalyxSepals(ctx, 0, 38, 1.45, 5);
  ctx.restore();
}

function drawLoosePetal(ctx, palette, rng, ruffled = false) {
  const cx = 400;
  const cy = 620;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.18);
  drawScallopedPetal(ctx, ruffled ? 225 : 195, 420, palette, rng, {
    ruffle: ruffled ? 0.16 : 0.05,
    veinCount: 9,
  });
  // Translucent cream claw attachment base
  const clawGrad = ctx.createRadialGradient(0, 0, 4, 0, -25, 70);
  clawGrad.addColorStop(0, palette.center);
  clawGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = clawGrad;
  ctx.beginPath();
  ctx.arc(0, -18, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPeony(ctx, cx, cy, palette, rng, small = false, seedNum = 7) {
  drawHerbaceousStem(ctx, cx, cy + 50, cx, 1300, 18, (rng() - 0.5) * 18, { seed: seedNum });
  const scaleFactor = small ? 0.72 : 1.0;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scaleFactor, scaleFactor);

  // Outer ruffled saucer petals -> fluffy undulating crest
  const ringSpecs = small
    ? [
        { count: 10, dist: 38, rx: 78, ry: 112 },
        { count: 10, dist: 22, rx: 64, ry: 92 },
        { count: 9, dist: 10, rx: 48, ry: 72 },
      ]
    : [
        { count: 12, dist: 56, rx: 94, ry: 130 },
        { count: 12, dist: 40, rx: 80, ry: 112 },
        { count: 11, dist: 24, rx: 66, ry: 92 },
        { count: 9, dist: 12, rx: 48, ry: 68 },
      ];

  ringSpecs.forEach((ring, idx) => {
    for (let i = 0; i < ring.count; i += 1) {
      const a = (i / ring.count) * Math.PI * 2 + idx * 0.43 + (rng() - 0.5) * 0.22;
      ctx.save();
      ctx.translate(Math.cos(a) * ring.dist, Math.sin(a) * ring.dist * 0.78);
      ctx.rotate(a + Math.PI * 0.5);
      drawScallopedPetal(ctx, ring.rx, ring.ry, palette, rng, {
        ruffle: 0.17,
        veinCount: 6,
        alpha: 0.92,
      });
      ctx.restore();
    }
  });

  // Peeking golden stamens inside full peony
  if (!small) {
    for (let s = 0; s < 28; s += 1) {
      const a = rng() * Math.PI * 2;
      const d = 8 + rng() * 26;
      ctx.strokeStyle = hexToRgba("#E6BA48", 0.78);
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * d, Math.sin(a) * d * 0.8);
      ctx.stroke();
      ctx.fillStyle = palette.center;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * d, Math.sin(a) * d * 0.8, 3.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawTulip(ctx, cx, cy, palette, rng, tilted = false, seedNum = 9) {
  const curveDx = tilted ? 46 : 8;
  drawHerbaceousStem(ctx, cx + (tilted ? 22 : 0), cy + 52, cx, 1300, 18, curveDx, {
    darkColor: "#42633D",
    midColor: "#638858",
    lightColor: "#8DB07B",
    addClaspingLeaf: true,
    seed: seedNum,
  });

  ctx.save();
  ctx.translate(cx + (tilted ? 24 : 0), cy + 48);
  if (tilted) {
    ctx.rotate(0.46); // ~26 deg photoreactive bend
  }

  // Three outer feathered tepals + three inner pointed tepals
  const drawTepal = (angle, wid, len, biasX) => {
    ctx.save();
    ctx.translate(biasX, 0);
    ctx.rotate(angle);
    const grad = ctx.createLinearGradient(0, 0, 0, -len);
    grad.addColorStop(0, palette.deep);
    grad.addColorStop(0.52, palette.mid);
    grad.addColorStop(0.88, palette.petal);
    grad.addColorStop(1, palette.rim);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-wid, -len * 0.25, -wid * 0.9, -len * 0.78, 0, -len);
    ctx.bezierCurveTo(wid * 0.9, -len * 0.78, wid, -len * 0.25, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hexToRgba(palette.rim, 0.38);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  };

  drawTepal(-0.22, 62, 168, -14);
  drawTepal(0.22, 62, 168, 14);
  drawTepal(0, 68, 186, 0);
  drawTepal(-0.08, 52, 174, -8);
  drawTepal(0.08, 52, 174, 8);
  ctx.restore();
}

function drawSunflower(ctx, cx, cy, palette, rng, angled = false, seedNum = 11) {
  drawHerbaceousStem(ctx, cx, cy + 42, cx, 1300, 22, angled ? 24 : -8, {
    darkColor: "#3D5834",
    midColor: "#5C7C4E",
    lightColor: "#85A771",
    addClaspingLeaf: true,
    seed: seedNum,
  });

  ctx.save();
  ctx.translate(cx + (angled ? 14 : 0), cy - 6);
  if (angled) {
    ctx.rotate(0.18);
    ctx.scale(0.82, 1.0); // foreshortened 3/4 ellipse
  }

  // Green involucre calyx bracts underneath if angled
  if (angled) {
    drawCalyxSepals(ctx, -18, 66, 1.8, 7);
  }

  // 34 radiating overlapping pointed ray florets
  const rayCount = 34;
  for (let pass = 0; pass < 2; pass += 1) {
    for (let i = 0; i < rayCount / 2; i += 1) {
      const a = ((i * 2 + pass) / rayCount) * Math.PI * 2 + (rng() - 0.5) * 0.05;
      ctx.save();
      ctx.rotate(a);
      const len = 148 + (rng() - 0.5) * 18;
      const rGrad = ctx.createLinearGradient(0, -52, 0, -len);
      rGrad.addColorStop(0, palette.deep);
      rGrad.addColorStop(0.35, palette.mid);
      rGrad.addColorStop(0.85, palette.petal);
      rGrad.addColorStop(1, palette.rim);
      ctx.fillStyle = rGrad;
      ctx.beginPath();
      ctx.moveTo(-13, -46);
      ctx.bezierCurveTo(-18, -len * 0.6, -9, -len * 0.92, 0, -len);
      ctx.bezierCurveTo(9, -len * 0.92, 18, -len * 0.6, 13, -46);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // Velvety dark umber seed disc + Fibonacci phyllotaxis pollen dots
  const discGrad = ctx.createRadialGradient(-8, -8, 10, 0, 0, 68);
  discGrad.addColorStop(0, "#593A22");
  discGrad.addColorStop(0.65, "#331D0F");
  discGrad.addColorStop(1, "#1D1008");
  ctx.fillStyle = discGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 66, 0, Math.PI * 2);
  ctx.fill();

  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let f = 0; f < 130; f += 1) {
    const r = Math.sqrt(f / 130) * 60;
    const th = f * golden;
    const fx = Math.cos(th) * r;
    const fy = Math.sin(th) * r;
    ctx.fillStyle = r > 44 ? "#F5B82E" : r > 28 ? "#8A5E29" : "#251409";
    ctx.beginPath();
    ctx.arc(fx, fy, r > 44 ? 2.8 : 2.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawLily(ctx, cx, cy, palette, rng, angled = false, seedNum = 13) {
  drawHerbaceousStem(ctx, cx, cy + 6, cx, 1300, 16, angled ? -20 : 6, {
    addClaspingLeaf: true,
    seed: seedNum,
  });

  ctx.save();
  ctx.translate(cx + (angled ? -12 : 0), cy);
  if (angled) {
    ctx.rotate(-0.34);
    ctx.scale(0.84, 0.96);
  }

  // Six sculptural star-reflexed undulating tepals
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2 + (i % 2 === 0 ? 0.03 : -0.03);
    ctx.save();
    ctx.rotate(a);
    const len = i % 2 === 0 ? 156 : 144;
    const grad = ctx.createLinearGradient(0, 0, 0, -len);
    grad.addColorStop(0, palette.center);
    grad.addColorStop(0.28, palette.mid);
    grad.addColorStop(0.75, palette.petal);
    grad.addColorStop(1, palette.rim);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-48, -len * 0.35, -36, -len * 0.85, 0, -len);
    ctx.bezierCurveTo(36, -len * 0.85, 48, -len * 0.35, 0, 0);
    ctx.closePath();
    ctx.fill();

    // Central nectar rib & burgundy papillae speckles
    ctx.strokeStyle = hexToRgba("#A5BA5E", 0.65);
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, -len * 0.65);
    ctx.stroke();

    for (let s = 0; s < 10; s += 1) {
      ctx.fillStyle = palette.deep;
      ctx.beginPath();
      ctx.arc((rng() - 0.5) * 26, -24 - rng() * (len * 0.45), 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Towering curved filaments + cinnabar-chocolate anthers
  for (let st = 0; st < 6; st += 1) {
    const a = (st / 6) * Math.PI * 2 + 0.3;
    const ex = Math.cos(a) * 62;
    const ey = Math.sin(a) * 52 - 12;
    ctx.strokeStyle = "#CBD992";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(ex * 0.4, ey * 0.4 - 18, ex, ey);
    ctx.stroke();
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(a);
    ctx.fillStyle = "#8C331A";
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawOrchid(ctx, cx, cy, palette, rng, seedNum = 17) {
  // Arching cane stem with 3 graduated moth blossoms
  ctx.save();
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx + 10, 1300);
  ctx.bezierCurveTo(cx + 12, 820, cx + 65, 480, cx - 70, 155);
  ctx.lineWidth = 14;
  ctx.strokeStyle = "#4F6B43";
  ctx.stroke();

  const drawMothBloom = (bx, by, sc, rot) => {
    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(sc, sc);
    ctx.rotate(rot);

    // 3 narrow sepals + 2 rounded broad lateral butterfly wings
    const petalShape = (ang, w, l) => {
      ctx.save();
      ctx.rotate(ang);
      const grad = ctx.createRadialGradient(0, -l * 0.4, 8, 0, -l * 0.5, l);
      grad.addColorStop(0, palette.mid);
      grad.addColorStop(0.5, palette.petal);
      grad.addColorStop(1, palette.rim);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-w, -l * 0.2, -w * 1.15, -l * 0.85, 0, -l);
      ctx.bezierCurveTo(w * 1.15, -l * 0.85, w, -l * 0.2, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    petalShape(0, 32, 92);
    petalShape(2.45, 30, 86);
    petalShape(-2.45, 30, 86);
    petalShape(-1.42, 58, 96);
    petalShape(1.42, 58, 96);

    // Gold-rose throat lip (labellum)
    ctx.fillStyle = palette.center;
    ctx.beginPath();
    ctx.ellipse(0, 12, 16, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#B8495E";
    ctx.beginPath();
    ctx.arc(0, 2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawMothBloom(cx - 58, 195, 0.72, -0.35);
  drawMothBloom(cx + 10, 295, 0.92, -0.18);
  drawMothBloom(cx - 18, 415, 1.05, -0.05);
  ctx.restore();
}

function drawDahlia(ctx, cx, cy, palette, rng, seedNum = 19) {
  drawHerbaceousStem(ctx, cx, cy + 45, cx, 1300, 19, -8, { seed: seedNum });
  ctx.save();
  ctx.translate(cx, cy - 4);
  const rings = [
    { count: 18, inner: 42, len: 105, w: 22 },
    { count: 16, inner: 30, len: 86, w: 19 },
    { count: 14, inner: 18, len: 66, w: 16 },
    { count: 11, inner: 8, len: 46, w: 13 },
    { count: 7, inner: 2, len: 26, w: 10 },
  ];
  rings.forEach((r, ri) => {
    for (let i = 0; i < r.count; i += 1) {
      const a = (i / r.count) * Math.PI * 2 + ri * 0.21;
      ctx.save();
      ctx.rotate(a);
      const grad = ctx.createLinearGradient(0, -r.inner, 0, -(r.inner + r.len));
      grad.addColorStop(0, palette.deep);
      grad.addColorStop(0.55, palette.mid);
      grad.addColorStop(0.92, palette.petal);
      grad.addColorStop(1, palette.rim);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -r.inner + 12);
      ctx.bezierCurveTo(-r.w, -(r.inner + r.len * 0.45), -r.w * 0.7, -(r.inner + r.len * 0.92), 0, -(r.inner + r.len));
      ctx.bezierCurveTo(r.w * 0.7, -(r.inner + r.len * 0.92), r.w, -(r.inner + r.len * 0.45), 0, -r.inner + 12);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  });
  ctx.fillStyle = palette.center;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHydrangea(ctx, cx, cy, palette, rng, seedNum = 23) {
  drawHerbaceousStem(ctx, cx, cy + 50, cx, 1300, 22, 10, { addClaspingLeaf: true, seed: seedNum });
  ctx.save();
  ctx.translate(cx, cy - 8);

  // Spherical cluster of ~38 four-petaled florets
  for (let i = 0; i < 38; i += 1) {
    const t = i / 38;
    const rad = Math.sqrt(t) * 124;
    const ang = i * 2.39996 + rng() * 0.2;
    const fx = Math.cos(ang) * rad;
    const fy = Math.sin(ang) * rad * 0.86;
    const sc = 0.72 + (1 - t) * 0.35;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(rng() * Math.PI);
    ctx.scale(sc, sc);

    for (let p = 0; p < 4; p += 1) {
      ctx.save();
      ctx.rotate((p * Math.PI) / 2);
      const pGrad = ctx.createRadialGradient(0, -14, 2, 0, -14, 24);
      pGrad.addColorStop(0, palette.deep);
      pGrad.addColorStop(0.45, palette.mid);
      pGrad.addColorStop(0.85, palette.petal);
      pGrad.addColorStop(1, palette.rim);
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-18, -10, -18, -30, 0, -34);
      ctx.bezierCurveTo(18, -30, 18, -10, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = palette.center;
    ctx.beginPath();
    ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawRanunculus(ctx, cx, cy, palette, rng, seedNum = 29) {
  drawHerbaceousStem(ctx, cx, cy + 45, cx, 1300, 15, -14, { seed: seedNum });
  ctx.save();
  ctx.translate(cx, cy - 6);
  const ringCount = 8;
  for (let r = ringCount; r >= 1; r -= 1) {
    const radius = 14 + r * 14.5;
    const petals = 5 + r * 2;
    for (let p = 0; p < petals; p += 1) {
      const a = (p / petals) * Math.PI * 2 + r * 0.45;
      ctx.save();
      ctx.rotate(a);
      const frac = 1 - r / ringCount;
      ctx.fillStyle = frac > 0.6 ? palette.mid : frac > 0.25 ? palette.petal : palette.rim;
      ctx.beginPath();
      ctx.arc(0, -radius * 0.52, radius * 0.46, Math.PI, 0, false);
      ctx.bezierCurveTo(radius * 0.4, -radius * 0.1, -radius * 0.4, -radius * 0.1, -radius * 0.46, -radius * 0.52);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = hexToRgba(palette.deep, 0.22);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.fillStyle = palette.center;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAnemone(ctx, cx, cy, palette, rng, seedNum = 31) {
  drawHerbaceousStem(ctx, cx, cy + 48, cx, 1300, 16, 12, { seed: seedNum });
  ctx.save();
  ctx.translate(cx, cy - 4);
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * Math.PI * 2 + (rng() - 0.5) * 0.12;
    ctx.save();
    ctx.rotate(a);
    drawScallopedPetal(ctx, 56, 122, palette, rng, { ruffle: 0.04, innerDarkness: 0.42 });
    ctx.restore();
  }
  // Velvety dark indigo boss + ring of anthers
  for (let s = 0; s < 32; s += 1) {
    const a = (s / 32) * Math.PI * 2;
    ctx.strokeStyle = "#3A446B";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 42, Math.sin(a) * 42);
    ctx.stroke();
    ctx.fillStyle = "#191C2B";
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 43, Math.sin(a) * 43, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  const boss = ctx.createRadialGradient(-4, -5, 4, 0, 0, 32);
  boss.addColorStop(0, "#353A52");
  boss.addColorStop(1, "#12131F");
  ctx.fillStyle = boss;
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFillers(ctx, spec, cx, cy, rng, seedNum) {
  drawHerbaceousStem(ctx, cx, cy + 55, cx, 1300, 12, (rng() - 0.5) * 20, { omitLeaves: true, seed: seedNum });
  ctx.save();
  ctx.translate(cx, cy + 20);

  if (spec.kind === "babys-breath") {
    const twigs = [[-110, -145], [-65, -200], [0, -220], [72, -190], [115, -130], [-45, -85], [52, -70], [0, -125]];
    ctx.strokeStyle = "#5F7D56";
    ctx.lineWidth = 4;
    for (const [tx, ty] of twigs) {
      ctx.beginPath();
      ctx.moveTo(0, 45);
      ctx.quadraticCurveTo(tx * 0.45, ty * 0.35, tx, ty);
      ctx.stroke();
      for (let m = 0; m < 4; m += 1) {
        const bx = tx + (rng() - 0.5) * 65;
        const by = ty + (rng() - 0.5) * 65;
        for (let p = 0; p < 5; p += 1) {
          const a = (p / 5) * Math.PI * 2;
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.ellipse(bx + Math.cos(a) * 8, by + Math.sin(a) * 8, 7.5, 4.5, a, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#E8E3A6";
        ctx.beginPath();
        ctx.arc(bx, by, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (spec.kind === "chamomile" || spec.kind === "aster") {
    const isAster = spec.kind === "aster";
    const heads = isAster
      ? [[-65, -135, 0.92], [58, -110, 0.85], [0, -185, 1.0]]
      : [[-72, -125, 0.85], [64, -98, 0.88], [5, -172, 1.0], [-20, -40, 0.72]];
    for (const [hx, hy, sc] of heads) {
      ctx.strokeStyle = "#5E804F";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 50);
      ctx.quadraticCurveTo(hx * 0.45, hy * 0.45, hx, hy);
      ctx.stroke();

      ctx.save();
      ctx.translate(hx, hy);
      ctx.scale(sc, sc);
      const count = isAster ? 24 : 18;
      for (let i = 0; i < count; i += 1) {
        const a = (i / count) * Math.PI * 2;
        ctx.save();
        ctx.rotate(a);
        ctx.fillStyle = isAster ? spec.palette.petal : "#FFFFFF";
        ctx.beginPath();
        ctx.ellipse(0, -34, isAster ? 5.2 : 8.5, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      const dGrad = ctx.createRadialGradient(-4, -5, 2, 0, 0, 18);
      dGrad.addColorStop(0, "#FFE572");
      dGrad.addColorStop(1, spec.palette.center);
      ctx.fillStyle = dGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (spec.kind === "lavender") {
    const spikes = [
      { dx: -48, tipY: -225, tilt: -0.18 },
      { dx: 0, tipY: -265, tilt: 0.02 },
      { dx: 52, tipY: -215, tilt: 0.2 },
    ];
    for (const sp of spikes) {
      ctx.save();
      ctx.translate(sp.dx, 45);
      ctx.rotate(sp.tilt);
      ctx.strokeStyle = "#698265";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, sp.tipY);
      ctx.stroke();
      for (let y = sp.tipY; y < sp.tipY + 150; y += 16) {
        for (let b = -1; b <= 1; b += 1) {
          ctx.fillStyle = b === 0 ? spec.palette.petal : spec.palette.mid;
          ctx.beginPath();
          ctx.ellipse(b * 8, y, 7.5, 11, b * 0.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = hexToRgba(spec.palette.rim, 0.65);
          ctx.beginPath();
          ctx.ellipse(b * 7 - 2, y - 3, 2.5, 4.5, b * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  } else if (spec.kind === "waxflower") {
    const branches = [[-75, -165], [65, -140], [-10, -210]];
    for (const [bx, by] of branches) {
      ctx.strokeStyle = "#6B5644";
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(0, 50);
      ctx.quadraticCurveTo(bx * 0.5, by * 0.5, bx, by);
      ctx.stroke();
      for (let f = 0; f < 5; f += 1) {
        const fx = bx + (rng() - 0.5) * 75;
        const fy = by + f * 30;
        ctx.save();
        ctx.translate(fx, fy);
        for (let p = 0; p < 5; p += 1) {
          const a = (p / 5) * Math.PI * 2;
          ctx.fillStyle = spec.palette.petal;
          ctx.beginPath();
          ctx.ellipse(Math.cos(a) * 14, Math.sin(a) * 14, 12, 10, a, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = spec.palette.center;
        ctx.beginPath();
        ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  } else if (spec.kind === "lotus") {
    // Broad pleated lotus petals + central golden flat seed-pod
    for (let i = -2; i <= 2; i += 1) {
      ctx.save();
      ctx.translate(i * 18, 0);
      ctx.rotate(i * 0.25);
      drawScallopedPetal(ctx, 56, 155, spec.palette, rng, { ruffle: 0.03 });
      ctx.restore();
    }
    ctx.fillStyle = spec.palette.center;
    ctx.beginPath();
    ctx.ellipse(0, -108, 36, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let k = -2; k <= 2; k += 1) {
      ctx.fillStyle = "#6F5323";
      ctx.beginPath();
      ctx.arc(k * 10, -110, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawFoliage(ctx, spec, cx, cy, rng, seedNum) {
  const { palette, kind } = spec;
  drawHerbaceousStem(ctx, cx, cy + 80, cx, 1300, 12, (rng() - 0.5) * 32, {
    darkColor: palette.deep,
    midColor: palette.mid,
    lightColor: palette.rim,
    omitLeaves: true,
    seed: seedNum,
  });

  ctx.save();
  ctx.translate(cx, cy + 90);

  // Arching central foliate leader from y=0 upward to y=-310 (skipped for palmate Monstera blade)
  if (kind !== "monstera") {
    ctx.strokeStyle = kind.includes("eucalyptus") ? "#6F585A" : palette.deep;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(28, -140, -18, -285);
    ctx.stroke();
  }

  if (kind === "eucalyptus-silver" || kind === "eucalyptus-seeded") {
    const pairs = 6;
    for (let i = 0; i < pairs; i += 1) {
      const t = i / (pairs - 1);
      const y = -28 - t * 242;
      const sx = Math.sin(t * Math.PI) * 14 - t * 14;
      const leafR = 32 - t * 12;
      for (const side of [-1, 1]) {
        const lx = sx + side * (32 + t * 8);
        const ly = y - 10;
        ctx.strokeStyle = "#7D6466";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx, y);
        ctx.lineTo(lx, ly);
        ctx.stroke();

        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(side * 0.48);
        const grad = ctx.createRadialGradient(-4, -5, 3, 0, 0, leafR);
        grad.addColorStop(0, palette.rim);
        grad.addColorStop(0.55, palette.petal);
        grad.addColorStop(1, palette.mid);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, leafR, leafR * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (kind === "eucalyptus-seeded" && i % 2 === 1) {
        const dir = i % 3 === 1 ? -1 : 1;
        const bx = sx + dir * 68;
        const by = y + 26;
        ctx.strokeStyle = "#81735A";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(sx, y);
        ctx.quadraticCurveTo(sx + dir * 42, y - 6, bx, by);
        ctx.stroke();
        for (let d = 0; d < 6; d += 1) {
          ctx.fillStyle = d % 2 === 0 ? palette.center : "#9BA868";
          ctx.beginPath();
          ctx.arc(bx + (rng() - 0.5) * 32, by + (rng() - 0.5) * 26, 6.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  } else if (kind === "fern") {
    for (let i = 0; i < 16; i += 1) {
      const t = i / 15;
      const y = -12 - t * 265;
      const span = (1 - t * 0.65) * 105;
      for (const side of [-1, 1]) {
        ctx.fillStyle = i % 2 === 0 ? palette.petal : palette.mid;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.quadraticCurveTo(side * span * 0.55, y - 16, side * span, y - 6);
        ctx.quadraticCurveTo(side * span * 0.55, y + 10, 0, y + 7);
        ctx.closePath();
        ctx.fill();
      }
    }
  } else if (kind === "olive" || kind === "ruscus" || kind === "willow") {
    const count = kind === "willow" ? 13 : 9;
    const width = kind === "ruscus" ? 30 : 18;
    const len = kind === "willow" ? 105 : 74;
    for (let i = 0; i < count; i += 1) {
      const t = i / (count - 1);
      const y = -20 - t * 250;
      const side = i % 2 === 0 ? -1 : 1;
      ctx.save();
      ctx.translate(side * 6, y);
      ctx.rotate(side * (kind === "willow" ? 0.95 : 0.55));
      const lGrad = ctx.createLinearGradient(0, 0, side * len, 0);
      lGrad.addColorStop(0, palette.deep);
      lGrad.addColorStop(0.5, palette.mid);
      lGrad.addColorStop(1, palette.rim);
      ctx.fillStyle = lGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(side * len * 0.35, -width, side * len * 0.85, -width * 0.6, side * len, 0);
      ctx.bezierCurveTo(side * len * 0.85, width * 0.6, side * len * 0.35, width, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      if (kind === "olive" && i % 3 === 1) {
        ctx.fillStyle = palette.center;
        ctx.beginPath();
        ctx.ellipse(-side * 14, y - 12, 10, 14, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (kind === "pine") {
    for (let n = 0; n < 44; n += 1) {
      const t = n / 44;
      const y = -25 - t * 240;
      const side = n % 2 === 0 ? -1 : 1;
      for (let f = 0; f < 4; f += 1) {
        ctx.strokeStyle = f % 2 === 0 ? palette.petal : palette.deep;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(side * (48 + rng() * 52), y - 35 - rng() * 45);
        ctx.stroke();
      }
    }
  } else if (kind === "dusty-miller") {
    for (let i = 0; i < 6; i += 1) {
      const a = -0.9 + (i / 5) * 1.8;
      ctx.save();
      ctx.translate(0, -30);
      ctx.rotate(a);
      const grad = ctx.createLinearGradient(0, 0, 0, -210);
      grad.addColorStop(0, palette.deep);
      grad.addColorStop(0.5, palette.mid);
      grad.addColorStop(1, palette.rim);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-48, -60, -56, -155, 0, -215);
      ctx.bezierCurveTo(56, -155, 48, -60, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  } else if (kind === "monstera") {
    // Iconic heart-shaped tropical Monstera Deliciosa with sculpted natural fenestration splits
    const mW = 460;
    const mH = 440;
    const off = createCanvas(mW, mH);
    const octx = off.getContext("2d");
    const mx = mW * 0.5;
    const my = mH * 0.82;

    const bladeGrad = octx.createRadialGradient(mx - 24, my - 190, 20, mx, my - 150, 230);
    bladeGrad.addColorStop(0, palette.petal);
    bladeGrad.addColorStop(0.55, palette.mid);
    bladeGrad.addColorStop(1, palette.deep);
    octx.fillStyle = bladeGrad;

    // Cordate tropical leaf contour
    octx.beginPath();
    octx.moveTo(mx, my - 26);
    octx.bezierCurveTo(mx - 65, my + 24, mx - 185, my - 18, mx - 178, my - 140);
    octx.bezierCurveTo(mx - 172, my - 245, mx - 88, my - 308, mx, my - 332);
    octx.bezierCurveTo(mx + 88, my - 308, mx + 172, my - 245, mx + 178, my - 140);
    octx.bezierCurveTo(mx + 185, my - 18, mx + 65, my + 24, mx, my - 26);
    octx.closePath();
    octx.fill();

    // Crisp central midrib and curved veins
    octx.strokeStyle = hexToRgba(palette.rim, 0.45);
    octx.lineWidth = 5;
    octx.beginPath();
    octx.moveTo(mx, my + 12);
    octx.quadraticCurveTo(mx + 4, my - 150, mx, my - 314);
    octx.stroke();

    // Carve clean lateral splits & inner fenestrations with destination-out on isolated canvas
    octx.globalCompositeOperation = "destination-out";
    octx.fillStyle = "#000000";
    const carveSplit = (side, yPos, innerX, widthPx, curveDy) => {
      octx.beginPath();
      octx.moveTo(mx + side * 200, yPos - widthPx * 0.65);
      octx.quadraticCurveTo(mx + side * (innerX + 45), yPos + curveDy, mx + side * innerX, yPos + 4);
      octx.quadraticCurveTo(mx + side * (innerX + 45), yPos + widthPx + curveDy * 0.7, mx + side * 200, yPos + widthPx * 0.85);
      octx.closePath();
      octx.fill();
    };
    carveSplit(-1, my - 88, 56, 20, -10);
    carveSplit(-1, my - 158, 48, 22, -12);
    carveSplit(-1, my - 226, 44, 18, -10);
    carveSplit(1, my - 110, 52, 22, -10);
    carveSplit(1, my - 184, 46, 20, -12);
    carveSplit(1, my - 244, 46, 16, -8);

    // Subtle interior oval fenestration pores
    octx.beginPath();
    octx.ellipse(mx - 42, my - 124, 12, 7, -0.35, 0, Math.PI * 2);
    octx.ellipse(mx + 40, my - 146, 13, 7, 0.35, 0, Math.PI * 2);
    octx.fill();

    octx.globalCompositeOperation = "source-over";
    ctx.drawImage(off, -mx, -my + 26);
  } else if (kind === "autumn-oak") {
    const leafPairs = 7;
    for (let i = 0; i < leafPairs; i += 1) {
      const t = i / (leafPairs - 1);
      const y = -28 - t * 238;
      const side = i % 2 === 0 ? -1 : 1;
      const len = 96 - t * 22;
      ctx.save();
      ctx.translate(side * 4, y);
      ctx.rotate(side * 0.58);
      const oGrad = ctx.createLinearGradient(0, 0, side * len, 0);
      oGrad.addColorStop(0, palette.deep);
      oGrad.addColorStop(0.5, palette.mid);
      oGrad.addColorStop(0.88, palette.petal);
      oGrad.addColorStop(1, palette.rim);
      ctx.fillStyle = oGrad;
      // Oak-lobed silhouette via scalloped bezier contour
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(side * len * 0.25, -20, side * len * 0.42, -35, side * len * 0.55, -24);
      ctx.bezierCurveTo(side * len * 0.68, -35, side * len * 0.85, -20, side * len, -4);
      ctx.bezierCurveTo(side * len * 0.86, 20, side * len * 0.68, 33, side * len * 0.54, 22);
      ctx.bezierCurveTo(side * len * 0.4, 33, side * len * 0.24, 20, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = hexToRgba(palette.rim, 0.42);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(side * len * 0.88, -2);
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.restore();
}

function generateAllFlowers() {
  const outDir = path.join(MASTER_ROOT, "flowers");
  fs.mkdirSync(outDir, { recursive: true });

  BOTANICAL_SPECS.forEach((spec, idx) => {
    const isPetal = spec.role === "petal";
    const W = isPetal ? WORLD_MASTER_ASPECT.petalSizePx : WORLD_MASTER_ASPECT.stemWidthPx;
    const H = isPetal ? WORLD_MASTER_ASPECT.petalSizePx : WORLD_MASTER_ASPECT.stemHeightPx;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");
    const rng = seededRng(spec.skuId);

    const cx = Math.round(W * WORLD_MASTER_ASPECT.stemAnchorX);
    const cy = Math.round(H * WORLD_MASTER_ASPECT.stemAnchorY);

    switch (spec.kind) {
      case "rose-open":
        drawRoseOpen(ctx, cx, cy, spec.palette, rng, idx + 1);
        break;
      case "rose-half":
        drawRoseHalf(ctx, cx, cy, spec.palette, rng, idx + 1);
        break;
      case "rose-bud":
        drawRoseBud(ctx, cx, cy, spec.palette, rng, idx + 1);
        break;
      case "petal":
        drawLoosePetal(ctx, spec.palette, rng, false);
        break;
      case "petal-ruffled":
        drawLoosePetal(ctx, spec.palette, rng, true);
        break;
      case "peony-full":
        drawPeony(ctx, cx, cy, spec.palette, rng, false, idx + 1);
        break;
      case "peony-small":
        drawPeony(ctx, cx, cy, spec.palette, rng, true, idx + 1);
        break;
      case "tulip-upright":
        drawTulip(ctx, cx, cy, spec.palette, rng, false, idx + 1);
        break;
      case "tulip-tilted":
        drawTulip(ctx, cx, cy, spec.palette, rng, true, idx + 1);
        break;
      case "sunflower-front":
        drawSunflower(ctx, cx, cy, spec.palette, rng, false, idx + 1);
        break;
      case "sunflower-angled":
        drawSunflower(ctx, cx, cy, spec.palette, rng, true, idx + 1);
        break;
      case "lily-up":
        drawLily(ctx, cx, cy, spec.palette, rng, false, idx + 1);
        break;
      case "lily-angled":
        drawLily(ctx, cx, cy, spec.palette, rng, true, idx + 1);
        break;
      case "orchid":
        drawOrchid(ctx, cx, cy, spec.palette, rng, idx + 1);
        break;
      case "dahlia":
        drawDahlia(ctx, cx, cy, spec.palette, rng, idx + 1);
        break;
      case "hydrangea":
        drawHydrangea(ctx, cx, cy, spec.palette, rng, idx + 1);
        break;
      case "ranunculus":
        drawRanunculus(ctx, cx, cy, spec.palette, rng, idx + 1);
        break;
      case "anemone":
        drawAnemone(ctx, cx, cy, spec.palette, rng, idx + 1);
        break;
      default:
        if (spec.role === "filler") {
          drawFillers(ctx, spec, cx, cy, rng, idx + 1);
        } else {
          drawFoliage(ctx, spec, cx, cy, rng, idx + 1);
        }
    }

    fs.writeFileSync(path.join(outDir, `${spec.skuId}.png`), canvas.toBuffer("image/png"));
  });
}

function generateAllVessels() {
  const outDir = path.join(MASTER_ROOT, "vessels");
  fs.mkdirSync(outDir, { recursive: true });
  const W = WORLD_MASTER_ASPECT.vesselWidthPx;
  const H = WORLD_MASTER_ASPECT.vesselHeightPx;
  const S = 1.4; // world 1000x1200 -> master 1400x1680

  for (const vessel of VESSEL_VISUAL_SPECS) {
    const backCanvas = createCanvas(W, H);
    const bCtx = backCanvas.getContext("2d");
    const frontCanvas = createCanvas(W, H);
    const fCtx = frontCanvas.getContext("2d");

    if (vessel.category === "wrap") {
      const isCellophane = vessel.texture === "cellophane";
      const backOpacity = isCellophane ? 0.42 : 1;

      // BACK LAYER: tall architectural folded sheets rising behind stems
      bCtx.save();
      bCtx.globalAlpha = backOpacity;
      const bGrad = bCtx.createLinearGradient(320 * S, 430 * S, 680 * S, 1085 * S);
      bGrad.addColorStop(0, vessel.lining);
      bGrad.addColorStop(0.55, vessel.base);
      bGrad.addColorStop(1, vessel.foldDark);
      bCtx.fillStyle = bGrad;
      bCtx.beginPath();
      bCtx.moveTo(260 * S, 555 * S);
      bCtx.lineTo(395 * S, 430 * S);
      bCtx.lineTo(500 * S, 468 * S);
      bCtx.lineTo(615 * S, 425 * S);
      bCtx.lineTo(745 * S, 558 * S);
      bCtx.lineTo(595 * S, 1085 * S);
      bCtx.lineTo(405 * S, 1085 * S);
      bCtx.closePath();
      bCtx.fill();

      if (isCellophane) {
        bCtx.globalAlpha = 0.85;
        bCtx.strokeStyle = "rgba(176, 206, 204, 0.72)";
        bCtx.lineWidth = 3.5;
        bCtx.stroke();
        // Crisp diagonal crinkle highlights on back film
        bCtx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        bCtx.lineWidth = 5;
        bCtx.beginPath();
        bCtx.moveTo(310 * S, 515 * S);
        bCtx.lineTo(435 * S, 1045 * S);
        bCtx.moveTo(685 * S, 520 * S);
        bCtx.lineTo(562 * S, 1045 * S);
        bCtx.stroke();
      } else {
        // Inner dark pocket depth
        bCtx.fillStyle = hexToRgba(vessel.foldDark, 0.35);
        bCtx.beginPath();
        bCtx.moveTo(335 * S, 650 * S);
        bCtx.lineTo(665 * S, 650 * S);
        bCtx.lineTo(575 * S, 1075 * S);
        bCtx.lineTo(425 * S, 1075 * S);
        bCtx.closePath();
        bCtx.fill();
      }
      bCtx.restore();

      // FRONT LAYER: crisp overlapping V-folds & apron hugging collar below flower heads
      fCtx.save();
      if (isCellophane) {
        // Translucent glassy wrap showing green stems beneath clear film
        const cLeft = fCtx.createLinearGradient(295 * S, 640 * S, 585 * S, 1085 * S);
        cLeft.addColorStop(0, "rgba(255, 255, 255, 0.42)");
        cLeft.addColorStop(0.45, "rgba(232, 245, 244, 0.22)");
        cLeft.addColorStop(1, "rgba(195, 224, 222, 0.36)");
        fCtx.fillStyle = cLeft;
        fCtx.beginPath();
        fCtx.moveTo(295 * S, 640 * S);
        fCtx.lineTo(548 * S, 765 * S);
        fCtx.lineTo(585 * S, 1085 * S);
        fCtx.lineTo(415 * S, 1085 * S);
        fCtx.closePath();
        fCtx.fill();
        fCtx.strokeStyle = "rgba(165, 200, 198, 0.55)";
        fCtx.lineWidth = 3;
        fCtx.stroke();

        const cRight = fCtx.createLinearGradient(450 * S, 645 * S, 705 * S, 1085 * S);
        cRight.addColorStop(0, "rgba(255, 255, 255, 0.48)");
        cRight.addColorStop(0.55, "rgba(235, 248, 247, 0.18)");
        cRight.addColorStop(1, "rgba(190, 220, 218, 0.34)");
        fCtx.fillStyle = cRight;
        fCtx.beginPath();
        fCtx.moveTo(705 * S, 645 * S);
        fCtx.lineTo(585 * S, 1085 * S);
        fCtx.lineTo(432 * S, 1085 * S);
        fCtx.lineTo(475 * S, 755 * S);
        fCtx.closePath();
        fCtx.fill();
        fCtx.stroke();

        // Diagonal specular gloss bands
        fCtx.fillStyle = "rgba(255, 255, 255, 0.48)";
        fCtx.beginPath();
        fCtx.moveTo(340 * S, 675 * S);
        fCtx.lineTo(372 * S, 690 * S);
        fCtx.lineTo(458 * S, 1068 * S);
        fCtx.lineTo(434 * S, 1068 * S);
        fCtx.closePath();
        fCtx.fill();
      } else {
        const fLeftGrad = fCtx.createLinearGradient(320 * S, 660 * S, 540 * S, 1085 * S);
        fLeftGrad.addColorStop(0, vessel.foldLight);
        fLeftGrad.addColorStop(0.7, vessel.base);
        fLeftGrad.addColorStop(1, vessel.foldDark);
        fCtx.fillStyle = fLeftGrad;
        fCtx.beginPath();
        fCtx.moveTo(295 * S, 640 * S);
        fCtx.lineTo(548 * S, 765 * S);
        fCtx.lineTo(585 * S, 1085 * S);
        fCtx.lineTo(415 * S, 1085 * S);
        fCtx.closePath();
        fCtx.fill();

        const fRightGrad = fCtx.createLinearGradient(460 * S, 645 * S, 705 * S, 1085 * S);
        fRightGrad.addColorStop(0, vessel.foldLight);
        fRightGrad.addColorStop(0.55, vessel.base);
        fRightGrad.addColorStop(1, vessel.foldDark);
        fCtx.fillStyle = fRightGrad;
        fCtx.beginPath();
        fCtx.moveTo(705 * S, 645 * S);
        fCtx.lineTo(585 * S, 1085 * S);
        fCtx.lineTo(432 * S, 1085 * S);
        fCtx.lineTo(475 * S, 755 * S);
        fCtx.closePath();
        fCtx.fill();

        // Clipped surface ornamentation (textured weave or botanical floral pattern)
        if (vessel.texture === "herringbone" || vessel.texture === "floral") {
          fCtx.save();
          fCtx.beginPath();
          fCtx.moveTo(295 * S, 640 * S);
          fCtx.lineTo(500 * S, 748 * S);
          fCtx.lineTo(705 * S, 645 * S);
          fCtx.lineTo(585 * S, 1085 * S);
          fCtx.lineTo(415 * S, 1085 * S);
          fCtx.closePath();
          fCtx.clip();

          if (vessel.texture === "herringbone") {
            fCtx.strokeStyle = hexToRgba("#7A6D59", 0.17);
            fCtx.lineWidth = 2.4;
            for (let x = 260 * S; x <= 740 * S; x += 26) {
              for (let y = 620 * S; y <= 1100 * S; y += 28) {
                fCtx.beginPath();
                fCtx.moveTo(x - 12, y);
                fCtx.lineTo(x, y - 13);
                fCtx.lineTo(x + 12, y);
                fCtx.stroke();
              }
            }
          } else if (vessel.texture === "floral") {
            const patRng = seededRng("floral-wrap-motif");
            for (let m = 0; m < 44; m += 1) {
              const mx = (320 + patRng() * 360) * S;
              const my = (675 + patRng() * 380) * S;
              const mr = 10 + patRng() * 9;
              // Tiny sage leaf pair
              fCtx.fillStyle = "rgba(104, 128, 106, 0.34)";
              fCtx.beginPath();
              fCtx.ellipse(mx - mr * 0.9, my + 4, mr * 0.65, mr * 0.28, -0.5, 0, Math.PI * 2);
              fCtx.ellipse(mx + mr * 0.9, my + 4, mr * 0.65, mr * 0.28, 0.5, 0, Math.PI * 2);
              fCtx.fill();
              // Mini rosette
              fCtx.fillStyle = m % 2 === 0 ? "rgba(182, 106, 114, 0.38)" : "rgba(176, 134, 88, 0.34)";
              for (let p = 0; p < 5; p += 1) {
                const a = (p / 5) * Math.PI * 2;
                fCtx.beginPath();
                fCtx.arc(mx + Math.cos(a) * mr * 0.42, my + Math.sin(a) * mr * 0.42, mr * 0.38, 0, Math.PI * 2);
                fCtx.fill();
              }
              fCtx.fillStyle = "rgba(218, 178, 92, 0.55)";
              fCtx.beginPath();
              fCtx.arc(mx, my, mr * 0.24, 0, Math.PI * 2);
              fCtx.fill();
            }
          }
          fCtx.restore();
        }

        // Subtle paper fold crease shadow + linen fiber speckles
        fCtx.strokeStyle = hexToRgba("#000000", 0.08);
        fCtx.lineWidth = 3;
        fCtx.beginPath();
        fCtx.moveTo(475 * S, 755 * S);
        fCtx.lineTo(432 * S, 1085 * S);
        fCtx.stroke();

        const rng = seededRng(vessel.id);
        for (let i = 0; i < 420; i += 1) {
          fCtx.fillStyle = i % 2 === 0 ? hexToRgba("#FFFFFF", 0.09) : hexToRgba("#000000", 0.05);
          fCtx.fillRect((330 + rng() * 340) * S, (680 + rng() * 390) * S, 2.2, 2.2);
        }
      }
      fCtx.restore();
    } else if (vessel.id === "vase-clear-glass") {
      // BACK LAYER: crystal rim ellipse & water basin tint
      bCtx.save();
      bCtx.strokeStyle = hexToRgba("#99B8B4", 0.5);
      bCtx.lineWidth = 4;
      bCtx.beginPath();
      bCtx.ellipse(500 * S, 700 * S, 104 * S, 22 * S, 0, 0, Math.PI * 2);
      bCtx.stroke();

      // Water volume inside lower vessel below waterline y=770
      const wGrad = bCtx.createLinearGradient(368 * S, 770 * S, 632 * S, 1080 * S);
      wGrad.addColorStop(0, "rgba(210, 232, 230, 0.28)");
      wGrad.addColorStop(0.55, "rgba(182, 214, 212, 0.34)");
      wGrad.addColorStop(1, "rgba(155, 194, 191, 0.42)");
      bCtx.fillStyle = wGrad;
      bCtx.beginPath();
      bCtx.moveTo(382 * S, 770 * S);
      bCtx.quadraticCurveTo(366 * S, 910 * S, 394 * S, 1076 * S);
      bCtx.lineTo(606 * S, 1076 * S);
      bCtx.quadraticCurveTo(634 * S, 910 * S, 618 * S, 770 * S);
      bCtx.closePath();
      bCtx.fill();
      bCtx.restore();

      // FRONT LAYER: crystalline vertical reflections, water meniscus rim & solid bottom glass puck
      fCtx.save();
      fCtx.beginPath();
      fCtx.moveTo(395 * S, 700 * S);
      fCtx.quadraticCurveTo(364 * S, 910 * S, 394 * S, 1080 * S);
      fCtx.lineTo(606 * S, 1080 * S);
      fCtx.quadraticCurveTo(636 * S, 910 * S, 605 * S, 700 * S);
      fCtx.closePath();

      const gOverlay = fCtx.createLinearGradient(365 * S, 890 * S, 635 * S, 890 * S);
      gOverlay.addColorStop(0, "rgba(255, 255, 255, 0.48)");
      gOverlay.addColorStop(0.14, "rgba(255, 255, 255, 0.14)");
      gOverlay.addColorStop(0.5, "rgba(255, 255, 255, 0.03)");
      gOverlay.addColorStop(0.84, "rgba(218, 235, 234, 0.24)");
      gOverlay.addColorStop(1, "rgba(255, 255, 255, 0.56)");
      fCtx.fillStyle = gOverlay;
      fCtx.fill();

      fCtx.strokeStyle = "rgba(146, 178, 174, 0.68)";
      fCtx.lineWidth = 4;
      fCtx.stroke();

      // Waterline meniscus ellipse
      fCtx.strokeStyle = "rgba(255, 255, 255, 0.72)";
      fCtx.lineWidth = 3.5;
      fCtx.beginPath();
      fCtx.ellipse(500 * S, 770 * S, 112 * S, 16 * S, 0, 0, Math.PI * 2);
      fCtx.stroke();

      // Sunlit crystal optical highlight ribbon on left shoulder
      fCtx.fillStyle = "rgba(255, 255, 255, 0.42)";
      fCtx.beginPath();
      fCtx.moveTo(418 * S, 725 * S);
      fCtx.quadraticCurveTo(395 * S, 895 * S, 412 * S, 1052 * S);
      fCtx.lineTo(430 * S, 1052 * S);
      fCtx.quadraticCurveTo(414 * S, 895 * S, 434 * S, 725 * S);
      fCtx.closePath();
      fCtx.fill();

      // Solid refracted glass base slab
      fCtx.fillStyle = "rgba(215, 232, 230, 0.55)";
      fCtx.beginPath();
      fCtx.ellipse(500 * S, 1072 * S, 106 * S, 16 * S, 0, 0, Math.PI * 2);
      fCtx.fill();
      fCtx.restore();
    } else {
      // Stoneware Cream Ceramic or Terracotta Vase
      bCtx.save();
      bCtx.fillStyle = vessel.lining;
      bCtx.beginPath();
      bCtx.ellipse(500 * S, 700 * S, 108 * S, 24 * S, 0, 0, Math.PI * 2);
      bCtx.fill();
      bCtx.restore();

      fCtx.save();
      const sGrad = fCtx.createLinearGradient(360 * S, 890 * S, 640 * S, 890 * S);
      sGrad.addColorStop(0, vessel.foldLight);
      sGrad.addColorStop(0.28, vessel.base);
      sGrad.addColorStop(0.75, vessel.base);
      sGrad.addColorStop(1, vessel.foldDark);
      fCtx.fillStyle = sGrad;
      fCtx.beginPath();
      fCtx.moveTo(392 * S, 700 * S);
      fCtx.quadraticCurveTo(360 * S, 918 * S, 402 * S, 1080 * S);
      fCtx.quadraticCurveTo(500 * S, 1102 * S, 598 * S, 1080 * S);
      fCtx.quadraticCurveTo(640 * S, 918 * S, 608 * S, 700 * S);
      fCtx.quadraticCurveTo(500 * S, 725 * S, 392 * S, 700 * S);
      fCtx.closePath();
      fCtx.fill();

      // Wheel-thrown rim bevel + subtle glaze speckle
      fCtx.strokeStyle = hexToRgba(vessel.foldLight, 0.7);
      fCtx.lineWidth = 6;
      fCtx.beginPath();
      fCtx.moveTo(394 * S, 702 * S);
      fCtx.quadraticCurveTo(500 * S, 728 * S, 606 * S, 702 * S);
      fCtx.stroke();

      const rng = seededRng(vessel.id);
      for (let sp = 0; sp < 260; sp += 1) {
        fCtx.fillStyle = hexToRgba(vessel.foldDark, 0.14);
        fCtx.beginPath();
        fCtx.arc((392 + rng() * 216) * S, (715 + rng() * 355) * S, 1.8, 0, Math.PI * 2);
        fCtx.fill();
      }
      fCtx.restore();
    }

    fs.writeFileSync(path.join(outDir, `${vessel.id}-back.png`), backCanvas.toBuffer("image/png"));
    fs.writeFileSync(path.join(outDir, `${vessel.id}-front.png`), frontCanvas.toBuffer("image/png"));
  }
}

function renderSingleRibbon(pal, bowStyle, finish) {
  const S = WORLD_MASTER_ASPECT.bowSizePx;
  const cx = S / 2;
  const cy = S / 2;
  const canvas = createCanvas(S, S);
  const ctx = canvas.getContext("2d");

  ctx.save();
  ctx.translate(cx, cy);

  const isVelvet = finish === "velvet";
  const isSatin = finish === "satin";
  const isTwine = finish === "twine" || pal.weave;

  // Horizontal band wrapping around bouquet waist
  const bandGrad = ctx.createLinearGradient(-115, 0, 115, 0);
  bandGrad.addColorStop(0, pal.dark);
  bandGrad.addColorStop(0.5, isVelvet ? pal.main : pal.light);
  bandGrad.addColorStop(1, pal.dark);
  ctx.fillStyle = bandGrad;
  ctx.beginPath();
  ctx.roundRect(-108, -14, 216, 28, 10);
  ctx.fill();

  if (bowStyle === "double-bow" || bowStyle === "silk-tails") {
    const tailLen = bowStyle === "silk-tails" || finish === "silk" ? 235 : 155;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.rotate(side * 0.16);
      const tGrad = ctx.createLinearGradient(0, 0, side * 40, tailLen);
      tGrad.addColorStop(0, pal.dark);
      tGrad.addColorStop(0.5, pal.main);
      tGrad.addColorStop(1, isVelvet ? pal.dark : pal.light);
      ctx.fillStyle = tGrad;
      ctx.beginPath();
      ctx.moveTo(side * 4, 6);
      ctx.quadraticCurveTo(side * 24, tailLen * 0.52, side * 52, tailLen);
      ctx.lineTo(side * 28, tailLen - 22);
      ctx.lineTo(side * 12, tailLen + 6);
      ctx.quadraticCurveTo(side * 2, tailLen * 0.5, side * -6, 8);
      ctx.closePath();
      ctx.fill();

      if (isSatin) {
        ctx.strokeStyle = "rgba(255,255,255,0.42)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(side * 2, 16);
        ctx.quadraticCurveTo(side * 16, tailLen * 0.5, side * 32, tailLen - 24);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  if (bowStyle === "double-bow") {
    for (const scaleMult of [1.0, 0.72]) {
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.scale(scaleMult, scaleMult);
        const loopGrad = ctx.createRadialGradient(side * 65, -8, 10, side * 75, 0, 95);
        loopGrad.addColorStop(0, isVelvet ? pal.main : pal.light);
        loopGrad.addColorStop(0.6, pal.main);
        loopGrad.addColorStop(1, pal.dark);
        ctx.fillStyle = loopGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(side * 58, -54, side * 138, -46, side * 124, 2);
        ctx.bezierCurveTo(side * 116, 46, side * 50, 36, 0, 6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = isVelvet ? hexToRgba(pal.edge, 0.62) : hexToRgba(pal.edge, 0.45);
        ctx.lineWidth = isVelvet ? 3 : 2;
        ctx.stroke();
        if (isSatin) {
          ctx.strokeStyle = "rgba(255,255,255,0.36)";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.bezierCurveTo(side * 42, -26, side * 95, -26, side * 102, -4);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  } else if (bowStyle === "minimal-knot") {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.rotate(side * 0.35);
      ctx.fillStyle = pal.main;
      ctx.beginPath();
      ctx.roundRect(-9, 8, 18, 92, 5);
      ctx.fill();
      ctx.restore();
    }
  }

  // Center knot or wax-band stamp medallion
  if (bowStyle === "wax-band") {
    const wGrad = ctx.createRadialGradient(-8, -8, 4, 0, 0, 36);
    wGrad.addColorStop(0, "#D38472");
    wGrad.addColorStop(0.7, "#9D4B3B");
    wGrad.addColorStop(1, "#6C2B20");
    ctx.fillStyle = wGrad;
    ctx.beginPath();
    ctx.arc(0, 2, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 224, 212, 0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 2, 23, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    const kGrad = ctx.createRadialGradient(-4, -4, 3, 0, 0, 24);
    kGrad.addColorStop(0, isVelvet ? pal.main : pal.light);
    kGrad.addColorStop(1, pal.dark);
    ctx.fillStyle = kGrad;
    ctx.beginPath();
    ctx.roundRect(-22, -16, 44, 32, 12);
    ctx.fill();
  }

  if (isVelvet) {
    // Plush matte velvet pile micro-stippling
    const vRng = seededRng(`velvet-${bowStyle}`);
    ctx.fillStyle = hexToRgba(pal.light, 0.16);
    for (let i = 0; i < 140; i += 1) {
      ctx.fillRect(-105 + vRng() * 210, -24 + vRng() * 48, 2, 2);
    }
  }

  if (isTwine) {
    ctx.strokeStyle = "rgba(74, 54, 30, 0.35)";
    ctx.lineWidth = 2.5;
    for (let x = -96; x < 96; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, -12);
      ctx.lineTo(x + 12, 12);
      ctx.stroke();
    }
  }

  ctx.restore();
  return canvas.toBuffer("image/png");
}

function generateAllRibbons() {
  const outDir = path.join(MASTER_ROOT, "ribbons");
  fs.mkdirSync(outDir, { recursive: true });

  for (const [colorId, pal] of Object.entries(RIBBON_PALETTES)) {
    for (const bowStyle of BOW_STYLE_LIST) {
      const defaultFinish = colorId === "natural-twine" ? "twine" : colorId.includes("velvet") ? "velvet" : colorId.includes("silk") ? "silk" : "satin";
      fs.writeFileSync(
        path.join(outDir, `${bowStyle}-${colorId}.png`),
        renderSingleRibbon(pal, bowStyle, defaultFinish),
      );
      for (const finish of RIBBON_FINISH_LIST) {
        fs.writeFileSync(
          path.join(outDir, `finish-${finish}-${bowStyle}-${colorId}.png`),
          renderSingleRibbon(pal, bowStyle, finish),
        );
      }
    }
  }
}

function enrichOccasionTags(spec) {
  const tags = new Set(spec.occasionTags ?? []);
  if (tags.has("romance") || spec.colorFamily === "crimson" || spec.skuId.includes("peony")) {
    tags.add("valentines-day");
  }
  if (
    spec.colorFamily === "ivory" ||
    spec.colorFamily === "blush" ||
    spec.skuId.includes("orchid") ||
    spec.skuId.includes("lily") ||
    spec.skuId.includes("ruscus") ||
    spec.skuId.includes("olive") ||
    spec.skuId.includes("babys-breath")
  ) {
    tags.add("wedding");
  }
  if (
    tags.has("birthday") ||
    tags.has("anniversary") ||
    spec.colorFamily === "amber" ||
    spec.skuId.includes("sunflower") ||
    spec.skuId.includes("orchid")
  ) {
    tags.add("congratulations");
  }
  if (
    spec.colorFamily === "amber" ||
    spec.colorFamily === "lavender" ||
    spec.skuId.includes("daisy") ||
    spec.skuId.includes("tulip")
  ) {
    tags.add("friendship");
  }
  if (
    spec.colorFamily === "blush" ||
    spec.colorFamily === "lavender" ||
    spec.skuId.includes("peony") ||
    spec.skuId.includes("ranunculus") ||
    spec.skuId.includes("lily")
  ) {
    tags.add("mothers-day");
  }
  if (spec.role === "foliage" || spec.role === "filler" || tags.has("thank-you") || tags.has("miss-you")) {
    tags.add("just-because");
  }
  return Array.from(tags);
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
    };
  });

  fs.mkdirSync(MASTER_ROOT, { recursive: true });
  fs.writeFileSync(path.join(MASTER_ROOT, "catalog-meta.json"), JSON.stringify(entries, null, 2));
}

generateAllFlowers();
generateAllVessels();
generateAllRibbons();
writeCatalogMetaJson();
console.log(
  `Generated ${BOTANICAL_SPECS.length} flowers, ${VESSEL_VISUAL_SPECS.length * 2} vessel layers, and ${Object.keys(RIBBON_PALETTES).length * BOW_STYLE_LIST.length * (1 + RIBBON_FINISH_LIST.length)} bow variations in ${MASTER_ROOT}`,
);
