import {
  BotanicalMeta,
  COLLAR_ANCHOR_X,
  COLLAR_ANCHOR_Y,
  CompositionPresetId,
  StemInstance,
} from "./types";

const GOLDEN_ANGLE_RAD = Math.PI * (3 - Math.sqrt(5)); // ~137.508 deg phyllotaxis

type PresetProfile = {
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  tiltStrength: number;
  biasAngleRad: number;
  minClearanceFactor: number;
  scaleSpread: number;
  stemFanBiasDeg: number;
  jitterAmp: number;
  asymmetryX: number;
  tallPeakY: number;
};

const PRESET_PROFILES: Record<CompositionPresetId, PresetProfile> = {
  round: {
    centerX: 500,
    centerY: 418,
    radiusX: 168,
    radiusY: 138,
    tiltStrength: 0.9,
    biasAngleRad: 0,
    minClearanceFactor: 0.72,
    scaleSpread: 0.16,
    stemFanBiasDeg: 0,
    jitterAmp: 10,
    asymmetryX: 0,
    tallPeakY: 235,
  },
  "hand-tied": {
    centerX: 500,
    centerY: 432,
    radiusX: 184,
    radiusY: 146,
    tiltStrength: 0.94,
    biasAngleRad: 0.16,
    minClearanceFactor: 0.7,
    scaleSpread: 0.16,
    stemFanBiasDeg: 4,
    jitterAmp: 12,
    asymmetryX: 0.06,
    tallPeakY: 245,
  },
  romantic: {
    centerX: 496,
    centerY: 422,
    radiusX: 196,
    radiusY: 160,
    tiltStrength: 0.92,
    biasAngleRad: -0.32,
    minClearanceFactor: 0.68,
    scaleSpread: 0.2,
    stemFanBiasDeg: -3,
    jitterAmp: 14,
    asymmetryX: -0.16,
    tallPeakY: 220,
  },
  garden: {
    centerX: 500,
    centerY: 405,
    radiusX: 222,
    radiusY: 176,
    tiltStrength: 0.95,
    biasAngleRad: 0.38,
    minClearanceFactor: 0.78,
    scaleSpread: 0.22,
    stemFanBiasDeg: 2,
    jitterAmp: 20,
    asymmetryX: 0.1,
    tallPeakY: 198,
  },
  luxury: {
    centerX: 502,
    centerY: 398,
    radiusX: 205,
    radiusY: 170,
    tiltStrength: 0.91,
    biasAngleRad: -0.22,
    minClearanceFactor: 0.68,
    scaleSpread: 0.22,
    stemFanBiasDeg: -1,
    jitterAmp: 12,
    asymmetryX: 0.14,
    tallPeakY: 190,
  },
  minimalist: {
    centerX: 500,
    centerY: 396,
    radiusX: 138,
    radiusY: 144,
    tiltStrength: 0.86,
    biasAngleRad: -0.4,
    minClearanceFactor: 0.98,
    scaleSpread: 0.18,
    stemFanBiasDeg: 3,
    jitterAmp: 8,
    asymmetryX: -0.12,
    tallPeakY: 215,
  },
  wildflower: {
    centerX: 500,
    centerY: 398,
    radiusX: 228,
    radiusY: 184,
    tiltStrength: 0.96,
    biasAngleRad: 0.58,
    minClearanceFactor: 0.76,
    scaleSpread: 0.24,
    stemFanBiasDeg: 0,
    jitterAmp: 22,
    asymmetryX: 0.04,
    tallPeakY: 185,
  },
  "spring-pastel": {
    centerX: 500,
    centerY: 412,
    radiusX: 188,
    radiusY: 152,
    tiltStrength: 0.9,
    biasAngleRad: 0.12,
    minClearanceFactor: 0.74,
    scaleSpread: 0.18,
    stemFanBiasDeg: 1,
    jitterAmp: 14,
    asymmetryX: 0.05,
    tallPeakY: 215,
  },
  sunset: {
    centerX: 502,
    centerY: 406,
    radiusX: 212,
    radiusY: 168,
    tiltStrength: 0.94,
    biasAngleRad: -0.28,
    minClearanceFactor: 0.72,
    scaleSpread: 0.22,
    stemFanBiasDeg: -2,
    jitterAmp: 16,
    asymmetryX: -0.1,
    tallPeakY: 200,
  },
  monochrome: {
    centerX: 498,
    centerY: 402,
    radiusX: 175,
    radiusY: 148,
    tiltStrength: 0.88,
    biasAngleRad: -0.15,
    minClearanceFactor: 0.82,
    scaleSpread: 0.18,
    stemFanBiasDeg: 2,
    jitterAmp: 10,
    asymmetryX: -0.06,
    tallPeakY: 210,
  },
  "peony-deluxe": {
    centerX: 500,
    centerY: 410,
    radiusX: 204,
    radiusY: 162,
    tiltStrength: 0.92,
    biasAngleRad: 0.2,
    minClearanceFactor: 0.7,
    scaleSpread: 0.2,
    stemFanBiasDeg: 0,
    jitterAmp: 12,
    asymmetryX: 0.08,
    tallPeakY: 205,
  },
};

function deterministicHash01(seedStr: string, index: number): number {
  let h = 2166136261 ^ index;
  for (let i = 0; i < seedStr.length; i += 1) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function computeFanRotation(
  x: number,
  y: number,
  meta: BotanicalMeta | undefined,
  profile: PresetProfile,
  noise01: number,
): number {
  // Aim every stem vector cleanly through the spiral ribbon pinch point (COLLAR_ANCHOR_X, COLLAR_ANCHOR_Y)
  const dx = x - COLLAR_ANCHOR_X;
  const dy = Math.max(120, COLLAR_ANCHOR_Y - y);
  const radialDeg = (Math.atan2(dx, dy) * 180) / Math.PI;
  const microDeg = (noise01 - 0.5) * 9;
  const rawDeg = radialDeg * profile.tiltStrength + profile.stemFanBiasDeg * 0.4 + microDeg;
  const minR = meta?.defaultMinRotDeg ?? -48;
  const maxR = meta?.defaultMaxRotDeg ?? 48;
  return Number(clamp(rawDeg, minR, maxR).toFixed(1));
}

function getEffectiveRadius(stem: StemInstance, metaMap: ReadonlyMap<string, BotanicalMeta>): number {
  const meta = metaMap.get(stem.skuId);
  const base = meta?.headRadiusWorld ?? 64;
  return base * stem.scale;
}

/**
 * Resolves excessive overlaps across unlocked stems while preserving locked anchors
 * and staying inside organic botanical silhouette boundaries.
 */
function resolveCollisions(
  items: StemInstance[],
  metaMap: ReadonlyMap<string, BotanicalMeta>,
  profile: PresetProfile,
): StemInstance[] {
  const out = items.map((s) => ({ ...s }));
  const iterations = 10;

  for (let iter = 0; iter < iterations; iter += 1) {
    for (let i = 0; i < out.length; i += 1) {
      for (let j = i + 1; j < out.length; j += 1) {
        const a = out[i]!;
        const b = out[j]!;
        if (a.locked && b.locked) continue;

        const rA = getEffectiveRadius(a, metaMap);
        const rB = getEffectiveRadius(b, metaMap);
        const targetDist = (rA + rB) * profile.minClearanceFactor;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.001;

        if (dist < targetDist) {
          const push = (targetDist - dist) * 0.42;
          const nx = dx / dist;
          const ny = dy / dist;

          if (!a.locked && !b.locked) {
            a.x -= nx * push;
            a.y -= ny * push * 0.85;
            b.x += nx * push;
            b.y += ny * push * 0.85;
          } else if (a.locked && !b.locked) {
            b.x += nx * push * 1.6;
            b.y += ny * push * 1.3;
          } else if (!a.locked && b.locked) {
            a.x -= nx * push * 1.6;
            a.y -= ny * push * 1.3;
          }
        }
      }
    }

    for (const s of out) {
      if (s.locked) continue;
      s.x = clamp(s.x, 225, 775);
      s.y = clamp(s.y, profile.tallPeakY, 610);
    }
  }

  return out;
}

/**
 * Intelligent Florist Composition Solver:
 * - Groups stems by floral hierarchy (Foliage halo -> Structural Focals -> Gap Fillers -> Petal accents)
 * - Uses Fibonacci phyllotaxis (137.508 deg) + asymmetric sculpting per preset
 * - Prevents flat grid cloning or uniform sizes
 * - Aims foliage/fillers cleanly into uncovered angular gaps around the focal dome
 * - Keeps `stem.locked === true` stems completely pinned in place
 */
export function arrangeBouquetByPreset(
  stems: readonly StemInstance[],
  preset: CompositionPresetId,
  metaMap: ReadonlyMap<string, BotanicalMeta>,
): StemInstance[] {
  if (stems.length === 0) return [];
  const profile = PRESET_PROFILES[preset];

  const lockedStems = stems.filter((s) => s.locked);
  const unlockedStems = stems.filter((s) => !s.locked);
  if (unlockedStems.length === 0) {
    return stems.map((s, idx) => ({ ...s, zIndex: idx }));
  }

  const focals = unlockedStems.filter((s) => (metaMap.get(s.skuId)?.role ?? "focal") === "focal");
  const fillers = unlockedStems.filter((s) => metaMap.get(s.skuId)?.role === "filler");
  const foliage = unlockedStems.filter((s) => metaMap.get(s.skuId)?.role === "foliage");
  const petals = unlockedStems.filter((s) => metaMap.get(s.skuId)?.role === "petal");

  // Sort focals so hero/larger blooms establish core inner mass
  focals.sort((a, b) => {
    const rA = metaMap.get(a.skuId)?.headRadiusWorld ?? 65;
    const rB = metaMap.get(b.skuId)?.headRadiusWorld ?? 65;
    return rB - rA;
  });

  const arranged: StemInstance[] = lockedStems.map((s) => ({ ...s }));
  const placedFocals: StemInstance[] = [...lockedStems];

  // 1. Place Focal Blooms around structured dome / luxury architecture
  focals.forEach((stem, idx) => {
    const meta = metaMap.get(stem.skuId);
    const n1 = deterministicHash01(stem.id + preset, idx * 3 + 1);
    const n2 = deterministicHash01(stem.id + preset, idx * 3 + 2);
    const n3 = deterministicHash01(stem.id + preset, idx * 3 + 3);

    const t = focals.length <= 1 ? 0 : idx / Math.max(1, focals.length);
    const rFactor = idx === 0 && preset !== "garden" ? 0.14 : Math.sqrt((idx + 0.45) / (focals.length + 0.6));
    let theta = idx * GOLDEN_ANGLE_RAD + profile.biasAngleRad + (n1 - 0.5) * 0.25;

    let rx = profile.radiusX * 0.72 * rFactor;
    let ry = profile.radiusY * 0.76 * rFactor;

    // Sculpted silhouette signature offsets
    if (preset === "luxury" && idx === 0) {
      rx = -22;
      ry = -155;
      theta = -Math.PI / 2;
    } else if (preset === "romantic") {
      // Gentle S-curve bias from upper-left to lower-right
      rx += Math.sin(t * Math.PI) * -35;
    } else if (preset === "minimalist") {
      // Crisp sculptural Ikebana diagonal line
      theta = -0.95 + idx * 0.58;
      rx = 75 * Math.cos(theta);
      ry = 95 * Math.sin(theta);
    } else if (preset === "peony-deluxe") {
      // Lush clustered dome with hero focal nestled right at center crown
      rx = idx === 0 ? 0 : Math.cos(theta) * rx * 0.92;
      ry = idx === 0 ? -28 : Math.sin(theta) * ry * 0.92;
    } else if (preset === "spring-pastel") {
      // Gentle upright cupped silhouette
      rx += Math.sin(theta) * 16;
      ry += Math.cos(theta) * -14;
    } else if (preset === "sunset") {
      // Warm outward radial energy
      rx *= 1.08;
      ry *= 1.04;
    } else if (preset === "monochrome") {
      // Architectural tiered vertical symmetry
      rx = (idx % 2 === 0 ? 1 : -1) * (22 + idx * 28);
      ry = -65 + idx * 26;
    }

    const jitterX = (n2 - 0.5) * profile.jitterAmp;
    const jitterY = (n3 - 0.5) * profile.jitterAmp;

    const x = clamp(
      profile.centerX + (preset === "minimalist" ? rx : Math.cos(theta) * rx) + profile.asymmetryX * 45 + jitterX,
      205,
      795,
    );
    const y = clamp(
      profile.centerY + (preset === "minimalist" ? ry : Math.sin(theta) * ry) + jitterY,
      profile.tallPeakY,
      625,
    );

    // Heterogeneous focal scales: inner anchor larger, outer perimeter gently lighter
    const scaleBase = idx === 0 ? 1.09 : idx < 3 ? 1.01 : 0.92;
    const scale = clamp(Number((scaleBase + (n1 - 0.5) * profile.scaleSpread).toFixed(2)), 0.76, 1.28);

    const candidate: StemInstance = {
      ...stem,
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
      scale,
      rotationDeg: computeFanRotation(x, y, meta, profile, n2),
      flippedX: idx % 2 === 1 && !(meta?.isRadialSymmetric ?? false),
    };
    placedFocals.push(candidate);
  });

  // 2. Angular Sector Gap Detection so Fillers & Greenery fill empty visual pockets organically
  const SECTOR_COUNT = 12;
  const sectorWeights = new Array<number>(SECTOR_COUNT).fill(0);
  for (const s of placedFocals) {
    const angle = Math.atan2(s.y - profile.centerY, s.x - profile.centerX);
    const norm = ((angle + Math.PI) / (Math.PI * 2)) * SECTOR_COUNT;
    const bin = Math.floor(norm) % SECTOR_COUNT;
    sectorWeights[bin] = (sectorWeights[bin] ?? 0) + 1;
  }

  const pickLeastCrowdedAngle = (seed: string, idx: number, upperBias: boolean): number => {
    let bestBin = 0;
    let lowestScore = Infinity;
    for (let b = 0; b < SECTOR_COUNT; b += 1) {
      const binAngle = -Math.PI + ((b + 0.5) / SECTOR_COUNT) * Math.PI * 2;
      // Avoid pointing foliage straight down behind solid wrap pocket center except trailing edges
      const downwardPenalty = binAngle > 0.55 && binAngle < 2.55 ? 2.4 : 0;
      const upperReward = upperBias && binAngle < 0 ? -0.4 : 0;
      const tieBreaker = deterministicHash01(seed, b + idx) * 0.45;
      const score = (sectorWeights[b] ?? 0) + downwardPenalty + upperReward + tieBreaker;
      if (score < lowestScore) {
        lowestScore = score;
        bestBin = b;
      }
    }
    sectorWeights[bestBin] = (sectorWeights[bestBin] ?? 0) + 0.9;
    return -Math.PI + ((bestBin + 0.5) / SECTOR_COUNT) * Math.PI * 2;
  };

  const arrangedFoliage: StemInstance[] = foliage.map((stem, idx) => {
    const meta = metaMap.get(stem.skuId);
    const n1 = deterministicHash01(stem.id, idx + 11);
    const n2 = deterministicHash01(stem.id, idx + 29);
    const theta = pickLeastCrowdedAngle(stem.id, idx, true);
    const rimDistX = profile.radiusX * (meta?.allowFrontDrape ? 1.06 : 1.02) * (0.88 + n1 * 0.18);
    const rimDistY = profile.radiusY * (meta?.allowFrontDrape ? 0.94 : 0.98) * (0.88 + n2 * 0.18);

    const x = clamp(profile.centerX + Math.cos(theta) * rimDistX, 200, 800);
    const y = clamp(profile.centerY + Math.sin(theta) * rimDistY - 12, 168, 565);
    const scale = clamp(Number((0.94 + (n1 - 0.5) * 0.16).toFixed(2)), 0.8, 1.16);

    return {
      ...stem,
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
      scale,
      rotationDeg: computeFanRotation(x, y, meta, profile, n2),
      flippedX: x < COLLAR_ANCHOR_X,
    };
  });

  const arrangedFillers: StemInstance[] = fillers.map((stem, idx) => {
    const meta = metaMap.get(stem.skuId);
    const n1 = deterministicHash01(stem.id, idx + 41);
    const n2 = deterministicHash01(stem.id, idx + 59);
    const theta = pickLeastCrowdedAngle(stem.id + "fill", idx, idx % 2 === 0);
    const ring = 0.68 + (idx % 3) * 0.14;

    const x = clamp(profile.centerX + Math.cos(theta) * profile.radiusX * ring, 215, 785);
    const y = clamp(profile.centerY + Math.sin(theta) * profile.radiusY * ring - 14, 178, 585);
    const scale = clamp(Number((0.88 + (n1 - 0.5) * 0.16).toFixed(2)), 0.74, 1.08);

    return {
      ...stem,
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
      scale,
      rotationDeg: computeFanRotation(x, y, meta, profile, n2),
      flippedX: n2 > 0.5,
    };
  });

  const arrangedPetals: StemInstance[] = petals.map((stem, idx) => {
    const n1 = deterministicHash01(stem.id, idx + 71);
    const x = clamp(COLLAR_ANCHOR_X + (idx % 2 === 0 ? -1 : 1) * (105 + n1 * 90), 210, 790);
    const y = clamp(545 + (idx * 28) % 90, 510, 660);
    return {
      ...stem,
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
      scale: Number((0.76 + n1 * 0.16).toFixed(2)),
      rotationDeg: Number(((n1 - 0.5) * 64).toFixed(1)),
      flippedX: idx % 2 === 1,
    };
  });

  // Back-to-Front layering:
  // Foliage (behind focals so long stalks frame edges rather than bisecting bloom faces) -> Fillers -> Focals -> Loose Petals
  const combined = resolveCollisions(
    [
      ...arrangedFoliage,
      ...arrangedFillers,
      ...placedFocals.filter((s) => !s.locked),
      ...arrangedPetals,
      ...arranged.filter((s) => s.locked),
    ],
    metaMap,
    profile,
  );

  // 5-Tier Botanical Depth Stacking:
  // 0 = back greenery halo framing top & flanks -> 1 = wispy upper/back fillers ->
  // 2 = upper/outer focals -> 3 = lush foreground collar focals & delicate clouds -> 4 = loose draping petals
  const depthRank = (s: StemInstance): number => {
    const meta = metaMap.get(s.skuId);
    if (!meta) return 2;
    if (meta.role === "foliage") return 0;
    if (meta.role === "petal") return 4;
    if (meta.role === "filler") return s.y > 465 ? 3 : 1;
    // Focals ordered naturally by radial elevation: high crown blooms slightly behind lower collar focals
    return s.y > 470 ? 3 : 2;
  };

  combined.sort((a, b) => depthRank(a) - depthRank(b) || a.y - b.y);
  return combined.map((s, idx) => ({ ...s, zIndex: idx }));
}

/**
 * Non-destructive insertion when user adds a new stem AFTER manually tweaking positions.
 * Never disturbs any existing stem's (x, y, rotation, scale) coordinates.
 */
export function insertStemIntoOpenSlot(
  existingStems: readonly StemInstance[],
  newSkuId: string,
  newId: string,
  preset: CompositionPresetId,
  metaMap: ReadonlyMap<string, BotanicalMeta>,
): StemInstance {
  const profile = PRESET_PROFILES[preset];
  const meta = metaMap.get(newSkuId);
  const role = meta?.role ?? "focal";
  const ringMult = role === "foliage" ? 1.0 : role === "filler" ? 0.85 : 0.68;

  let bestCandidate = { x: profile.centerX, y: profile.centerY - 25, minDist: -1 };
  const samples = 30;

  for (let k = 0; k < samples; k += 1) {
    const r = Math.sqrt((k + 0.5) / samples) * ringMult;
    const theta = k * GOLDEN_ANGLE_RAD + profile.biasAngleRad;
    const cx = clamp(profile.centerX + Math.cos(theta) * profile.radiusX * r, 210, 790);
    const cy = clamp(profile.centerY + Math.sin(theta) * profile.radiusY * r, profile.tallPeakY, 645);

    let minDist = Infinity;
    for (const s of existingStems) {
      const d = Math.hypot(cx - s.x, cy - s.y);
      if (d < minDist) minDist = d;
    }
    if (existingStems.length === 0) {
      bestCandidate = { x: profile.centerX, y: profile.centerY - 20, minDist: 999 };
      break;
    }
    if (minDist > bestCandidate.minDist) {
      bestCandidate = { x: cx, y: cy, minDist };
    }
  }

  const noise = deterministicHash01(newId, existingStems.length);
  const baseScale = role === "foliage" ? 0.94 : role === "filler" ? 0.88 : 0.98;
  const nextScale = clamp(Number((baseScale + (noise - 0.5) * 0.14).toFixed(2)), 0.74, 1.24);
  const nextZ = role === "foliage" ? 0 : existingStems.length;

  return {
    id: newId,
    skuId: newSkuId,
    x: Number(bestCandidate.x.toFixed(1)),
    y: Number(bestCandidate.y.toFixed(1)),
    scale: nextScale,
    rotationDeg: computeFanRotation(bestCandidate.x, bestCandidate.y, meta, profile, noise),
    flippedX: bestCandidate.x < COLLAR_ANCHOR_X && !(meta?.isRadialSymmetric ?? false),
    zIndex: nextZ,
    locked: false,
  };
}
