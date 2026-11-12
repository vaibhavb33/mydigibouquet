export type HitMaskBitset = {
  width: number;
  height: number;
  threshold: number;
  bitsBase64: string;
};

export type DecodedHitMask = {
  width: number;
  height: number;
  bytes: Uint8Array;
};

function decodeBase64ToBytes(b64: string): Uint8Array {
  if (typeof atob === "function") {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) {
      out[i] = bin.charCodeAt(i);
    }
    return out;
  }
  return new Uint8Array(Buffer.from(b64, "base64"));
}

export function decodeHitMask(raw: HitMaskBitset): DecodedHitMask {
  return {
    width: raw.width,
    height: raw.height,
    bytes: decodeBase64ToBytes(raw.bitsBase64),
  };
}

export function hitTestDecodedMask(
  mask: DecodedHitMask,
  normX: number,
  normY: number,
  slopRadiusPxInMask = 2,
): boolean {
  if (normX < -0.05 || normX > 1.05 || normY < -0.05 || normY > 1.05) {
    return false;
  }
  const cx = Math.round(normX * (mask.width - 1));
  const cy = Math.round(normY * (mask.height - 1));
  const r = Math.max(0, Math.round(slopRadiusPxInMask));

  for (let dy = -r; dy <= r; dy += 1) {
    const py = cy + dy;
    if (py < 0 || py >= mask.height) continue;
    for (let dx = -r; dx <= r; dx += 1) {
      if (dx * dx + dy * dy > r * r + 1) continue;
      const px = cx + dx;
      if (px < 0 || px >= mask.width) continue;
      const bitIndex = py * mask.width + px;
      const byteVal = mask.bytes[bitIndex >> 3] ?? 0;
      if ((byteVal & (1 << (bitIndex & 7))) !== 0) {
        return true;
      }
    }
  }
  return false;
}

const maskCache = new Map<string, Promise<DecodedHitMask | null>>();
const syncMaskCache = new Map<string, DecodedHitMask>();

export function getSyncHitMask(skuId: string): DecodedHitMask | undefined {
  return syncMaskCache.get(skuId);
}

export function preloadHitMask(skuId: string, hitmaskPath: string): Promise<DecodedHitMask | null> {
  const existing = maskCache.get(skuId);
  if (existing) return existing;

  const p = fetch(hitmaskPath)
    .then(async (res) => {
      if (!res.ok) return null;
      const json = (await res.json()) as HitMaskBitset;
      const decoded = decodeHitMask(json);
      syncMaskCache.set(skuId, decoded);
      return decoded;
    })
    .catch(() => null);

  maskCache.set(skuId, p);
  return p;
}

