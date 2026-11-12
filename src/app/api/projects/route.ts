import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db, ensureDbReady } from "@/db";
import { bouquetProjects } from "@/db/schema";
import { validateAndNormalizeScene } from "@/engine/validation";
import { ALLOWED_SKU_IDS } from "@/generated/catalog-manifest";
import { deriveProjectTitle, extractWorkspaceTokenHash } from "@/lib/workspace-server";
import { assertSameOrigin, checkRateLimit } from "@/lib/request-security";

export async function GET(req: Request) {
  try {
    const tokenHash = extractWorkspaceTokenHash(req);
    if (!tokenHash) {
      return NextResponse.json({ error: "Missing or invalid workspace token" }, { status: 401 });
    }

    await ensureDbReady();
    const rows = await db
      .select({
        id: bouquetProjects.id,
        title: bouquetProjects.title,
        occasionTag: bouquetProjects.occasionTag,
        stemCount: bouquetProjects.stemCount,
        publishedSlug: bouquetProjects.publishedSlug,
        createdAt: bouquetProjects.createdAt,
        updatedAt: bouquetProjects.updatedAt,
      })
      .from(bouquetProjects)
      .where(and(eq(bouquetProjects.workspaceTokenHash, tokenHash), isNull(bouquetProjects.deletedAt)))
      .orderBy(desc(bouquetProjects.updatedAt))
      .limit(50);

    return NextResponse.json({ projects: rows });
  } catch (error) {
    console.error("GET /api/projects error", error);
    return NextResponse.json({ error: "Unable to load saved projects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const originErr = assertSameOrigin(req);
  if (originErr) return originErr;

  const rateErr = checkRateLimit(req, { bucket: "projects-create", limit: 60, windowMs: 60_000 });
  if (rateErr) return rateErr;

  try {
    const tokenHash = extractWorkspaceTokenHash(req);
    if (!tokenHash) {
      return NextResponse.json({ error: "Missing or invalid workspace token" }, { status: 401 });
    }

    const rawBody = (await req.json()) as {
      title?: string;
      scene?: unknown;
      publishedSlug?: string | null;
    };

    const validated = validateAndNormalizeScene(rawBody.scene, ALLOWED_SKU_IDS);
    if (!validated.ok) {
      return NextResponse.json(
        { error: validated.error, fieldErrors: validated.fieldErrors },
        { status: 400 },
      );
    }

    await ensureDbReady();
    const id = randomUUID();
    const now = new Date().toISOString();
    const title = deriveProjectTitle(validated.scene, rawBody.title);
    const occasionTag = validated.scene.occasionTag ?? null;
    const stemCount = validated.scene.stems.length;
    const publishedSlug =
      typeof rawBody.publishedSlug === "string" && /^[a-z0-9_-]{3,40}$/i.test(rawBody.publishedSlug)
        ? rawBody.publishedSlug
        : null;

    await db.insert(bouquetProjects).values({
      id,
      workspaceTokenHash: tokenHash,
      title,
      occasionTag,
      stemCount,
      sceneJson: JSON.stringify(validated.scene),
      publishedSlug,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    return NextResponse.json(
      {
        project: {
          id,
          title,
          occasionTag,
          stemCount,
          publishedSlug,
          createdAt: now,
          updatedAt: now,
          scene: validated.scene,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/projects error", error);
    return NextResponse.json({ error: "Unable to save bouquet draft" }, { status: 500 });
  }
}

