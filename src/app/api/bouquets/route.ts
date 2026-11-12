import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { bouquets } from "@/db/schema";
import { db, ensureDbReady, getRecentGalleryBouquets, hashEditToken } from "@/db";
import { ALLOWED_SKU_IDS } from "@/generated/catalog-manifest";
import { sanitizeTextInput, validateAndNormalizeScene } from "@/engine/validation";
import { assertSameOrigin, checkRateLimit } from "@/lib/request-security";

const CreateBouquetBodySchema = z.object({
  title: z.string().max(120).optional(),
  scene: z.unknown(),
});

function createShareSlug(): string {
  return crypto.randomBytes(6).toString("base64url").replace(/[_-]/g, "x").slice(0, 8);
}

export async function GET() {
  try {
    const items = await getRecentGalleryBouquets(12);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("GET /api/bouquets error", err);
    return NextResponse.json({ error: "Failed to load bouquets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const originErr = assertSameOrigin(req);
  if (originErr) return originErr;

  const rateErr = checkRateLimit(req, { bucket: "bouquets-create", limit: 30, windowMs: 60_000 });
  if (rateErr) return rateErr;

  try {
    await ensureDbReady();
    const rawBody = await req.json();
    const bodyParse = CreateBouquetBodySchema.safeParse(rawBody);
    if (!bodyParse.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const validation = validateAndNormalizeScene(bodyParse.data.scene, ALLOWED_SKU_IDS, {
      requirePublishMinStems: true,
    });
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error, fieldErrors: validation.fieldErrors },
        { status: 422 },
      );
    }

    const scene = validation.scene;
    const isPublicListing = Boolean(scene.isPublicShowcase && !scene.hideNamesInPreview);
    const rawTitle =
      bodyParse.data.title?.trim() ||
      (!scene.hideNamesInPreview && scene.card.recipientName
        ? `For ${scene.card.recipientName}`
        : "Bespoke Digital Bouquet");
    const safeTitle = sanitizeTextInput(rawTitle, 60, 180) || "Bespoke Digital Bouquet";

    const randomId = createShareSlug();
    const slug = isPublicListing ? `pub-${randomId}` : randomId;
    const editToken = crypto.randomBytes(24).toString("hex");
    const now = new Date().toISOString();

    await db.insert(bouquets).values({
      slug,
      title: safeTitle,
      occasionTag: scene.occasionTag ?? null,
      sceneJson: JSON.stringify(scene),
      editTokenHash: hashEditToken(editToken),
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    return NextResponse.json(
      {
        slug,
        editToken,
        shareUrl: `/b/${slug}`,
        ogImageUrl: `/api/og/${slug}`,
        title: safeTitle,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/bouquets error", err);
    return NextResponse.json({ error: "Failed to save bouquet" }, { status: 500 });
  }
}

