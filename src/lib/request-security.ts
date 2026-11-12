import crypto from "node:crypto";
import { NextResponse } from "next/server";

type RateBucketEntry = {
  count: number;
  resetAt: number;
};

declare global {
  var __petalRateBuckets: Map<string, RateBucketEntry> | undefined;
  var __petalEphemeralSalt: string | undefined;
}

function getBucketMap(): Map<string, RateBucketEntry> {
  if (!globalThis.__petalRateBuckets) {
    globalThis.__petalRateBuckets = new Map();
  }
  return globalThis.__petalRateBuckets;
}

function getRateSalt(): string {
  const configured = process.env.RATE_LIMIT_SALT?.trim();
  if (configured) return configured;
  if (!globalThis.__petalEphemeralSalt) {
    globalThis.__petalEphemeralSalt = crypto.randomBytes(16).toString("hex");
  }
  return globalThis.__petalEphemeralSalt;
}

function normalizeHostHeader(value: string | null): string {
  if (!value) return "";
  return value.split(",")[0]!.trim().toLowerCase();
}

/**
 * Enforces same-origin protection when browsers send an `Origin` header on
 * state-changing POST/PATCH/DELETE requests.
 */
export function assertSameOrigin(req: Request): NextResponse | null {
  const originHeader = req.headers.get("origin");
  if (!originHeader || originHeader === "null") {
    return null;
  }

  let originHost = "";
  try {
    originHost = new URL(originHeader).host.toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const expectedHost =
    normalizeHostHeader(req.headers.get("x-forwarded-host")) ||
    normalizeHostHeader(req.headers.get("host"));

  if (expectedHost && originHost !== expectedHost) {
    return NextResponse.json(
      { error: "Cross-origin requests are not permitted for this endpoint." },
      { status: 403 },
    );
  }
  return null;
}

function hashClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const rawIp =
    (forwarded ? forwarded.split(",")[0]?.trim() : "") ||
    req.headers.get("x-real-ip")?.trim() ||
    "local-client";
  return crypto.createHmac("sha256", getRateSalt()).update(rawIp).digest("hex").slice(0, 24);
}

/**
 * Privacy-preserving sliding-window rate limiter using HMAC-hashed IPs held only
 * in ephemeral process memory (never stored on disk).
 */
export function checkRateLimit(
  req: Request,
  {
    bucket,
    limit,
    windowMs = 60_000,
  }: {
    bucket: string;
    limit: number;
    windowMs?: number;
  },
): NextResponse | null {
  const now = Date.now();
  const buckets = getBucketMap();

  // Opportunistic prune so long-running servers remain bounded in memory
  if (buckets.size > 4000) {
    for (const [k, entry] of buckets.entries()) {
      if (entry.resetAt <= now) buckets.delete(k);
    }
  }

  const key = `${bucket}:${hashClientIp(req)}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (existing.count >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before trying again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  existing.count += 1;
  return null;
}

