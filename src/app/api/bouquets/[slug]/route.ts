import { NextResponse } from "next/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { bouquets } from "@/db/schema";
import { db, ensureDbReady, hashEditToken } from "@/db";
import { ALLOWED_SKU_IDS } from "@/generated/catalog-manifest";
import { validateAndNormalizeScene } from "@/engine/validation";
import { assertSameOrigin, checkRateLimit } from "@/lib/request-security";

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    await ensureDbReady();
    const { slug } = await context.params;
    const rows = await db
      .select()
      .from(bouquets)
      .where(and(eq(bouquets.slug, slug), isNull(bouquets.deletedAt)))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: "Bouquet not found" }, { status: 404 });
    }

    await db
      .update(bouquets)
      .set({ viewCount: sql`${bouquets.viewCount} + 1` })
      .where(eq(bouquets.slug, slug));

    const scene = JSON.parse(row.sceneJson);
    return NextResponse.json({
      slug: row.slug,
      title: row.title,
      occasionTag: row.occasionTag,
      scene,
      viewCount: row.viewCount + 1,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  } catch (err) {
    console.error("GET /api/bouquets/[slug] error", err);
    return NextResponse.json({ error: "Failed to retrieve bouquet" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const originErr = assertSameOrigin(req);
  if (originErr) return originErr;

  const rateErr = checkRateLimit(req, { bucket: "bouquets-patch", limit: 30, windowMs: 60_000 });
  if (rateErr) return rateErr;

  try {
    await ensureDbReady();
    const { slug } = await context.params;
    const body = (await req.json()) as { editToken?: string; scene?: unknown };
    if (!body.editToken) {
      return NextResponse.json({ error: "Missing edit token" }, { status: 401 });
    }

    const rows = await db
      .select()
      .from(bouquets)
      .where(and(eq(bouquets.slug, slug), isNull(bouquets.deletedAt)))
      .limit(1);
    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: "Bouquet not found" }, { status: 404 });
    }
    if (hashEditToken(body.editToken) !== row.editTokenHash) {
      return NextResponse.json({ error: "Unauthorized edit token" }, { status: 403 });
    }

    const validation = validateAndNormalizeScene(body.scene, ALLOWED_SKU_IDS, {
      requirePublishMinStems: true,
    });
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error, fieldErrors: validation.fieldErrors },
        { status: 422 },
      );
    }

    const now = new Date().toISOString();
    await db
      .update(bouquets)
      .set({ sceneJson: JSON.stringify(validation.scene), updatedAt: now })
      .where(eq(bouquets.slug, slug));

    return NextResponse.json({
      slug,
      updatedAt: now,
      shareUrl: `/b/${slug}`,
      ogImageUrl: `/api/og/${slug}`,
    });
  } catch (err) {
    console.error("PATCH /api/bouquets/[slug] error", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

